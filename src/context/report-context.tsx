import React, { createContext, useContext, useState, ReactNode } from 'react'

export type ReportStatus = 'Rascunho' | 'Finalizado'

export interface Cliente {
  id: string
  nome: string
  cnpj: string
}

export interface Report {
  id: string
  numero: string
  clienteId: string
  dataExecucao: string
  status: ReportStatus
  observacoes: string
}

interface ReportContextType {
  reports: Report[]
  clientes: Cliente[]
  addReport: (report: Report) => void
  updateReport: (id: string, report: Partial<Report>) => void
}

const initialClientes: Cliente[] = [
  { id: '1', nome: 'Cliente A', cnpj: '11.222.333/0001-44' },
  { id: '2', nome: 'Cliente B', cnpj: '22.333.444/0001-55' },
]

const initialReports: Report[] = [
  {
    id: '1',
    numero: '001/2025',
    clienteId: '1',
    dataExecucao: '2025-01-15',
    status: 'Rascunho',
    observacoes: 'Necessita revisão nos disjuntores.',
  },
  {
    id: '2',
    numero: '002/2025',
    clienteId: '2',
    dataExecucao: '2025-01-20',
    status: 'Finalizado',
    observacoes: 'Manutenção concluída sem ressalvas.',
  },
  {
    id: '3',
    numero: '003/2025',
    clienteId: '1',
    dataExecucao: '2025-01-25',
    status: 'Rascunho',
    observacoes: 'Aguardando aprovação de orçamento para peças.',
  },
]

const ReportContext = createContext<ReportContextType | undefined>(undefined)

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [clientes] = useState<Cliente[]>(initialClientes)

  const addReport = (report: Report) => {
    setReports((prev) => [report, ...prev])
  }

  const updateReport = (id: string, updatedFields: Partial<Report>) => {
    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, ...updatedFields } : report)),
    )
  }

  return (
    <ReportContext.Provider value={{ reports, clientes, addReport, updateReport }}>
      {children}
    </ReportContext.Provider>
  )
}

export function useReports() {
  const context = useContext(ReportContext)
  if (!context) {
    throw new Error('useReports deve ser usado dentro de um ReportProvider')
  }
  return context
}
