import { EquipmentItem } from '@/types/reports'

export interface IDBDraft {
  id: string
  updatedAt: number
  values: any
  equipments: EquipmentItem[]
  existingAnexos: string[]
  reportIsNew: boolean
}

export interface PendingFile {
  id: string
  reportId: string
  collection: 'relatorios' | 'equipamentos_relatorio'
  recordId: string
  field: 'anexos' | 'fotos'
  file: File
  name: string
  createdAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

export const initDB = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('EletroTesteDB', 2)
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('pendingFiles')) {
          const store = db.createObjectStore('pendingFiles', { keyPath: 'id' })
          store.createIndex('reportId', 'reportId', { unique: false })
          store.createIndex('recordId', 'recordId', { unique: false })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  return dbPromise
}

export const saveDraft = async (draft: IDBDraft): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite')
    tx.objectStore('drafts').put(draft)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const getDraft = async (id: string): Promise<IDBDraft | undefined> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readonly')
    const request = tx.objectStore('drafts').get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const deleteDraft = async (id: string): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite')
    tx.objectStore('drafts').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const savePendingFile = async (file: PendingFile): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingFiles', 'readwrite')
    tx.objectStore('pendingFiles').put(file)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const getPendingFiles = async (): Promise<PendingFile[]> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingFiles', 'readonly')
    const request = tx.objectStore('pendingFiles').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const deletePendingFile = async (id: string): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingFiles', 'readwrite')
    tx.objectStore('pendingFiles').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const generateId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 15; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}
