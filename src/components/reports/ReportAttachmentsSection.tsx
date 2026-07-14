import React, { useState } from 'react'
import { Paperclip, X, Download, UploadCloud, Loader2, FileWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'

interface Props {
  record: any
  existingAnexos: string[]
  onAnexosChange: (newAnexos: string[]) => void
  onUploadStart: () => void
  onUploadEnd: () => void
  isView: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_TOTAL_SIZE = 100 * 1024 * 1024
const MAX_FILES = 99
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

function getUploadErrorMessage(error: any): string {
  if (!error) return 'Ocorreu um erro ao enviar os anexos. Tente novamente.'

  const status = error?.status ?? error?.response?.status

  if (status === 0 || error?.isAbort) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }

  if (status === 413) {
    return 'O tamanho total dos arquivos excede o limite permitido. Envie menos arquivos por vez.'
  }

  if (status === 400) {
    const fieldErrors = extractFieldErrors(error)
    if (fieldErrors.anexos) {
      return fieldErrors.anexos
    }
    const msg = getErrorMessage(error)
    if (msg && msg !== 'An unexpected error occurred.') {
      return msg
    }
    return 'Dados inválidos. Verifique o tipo e tamanho dos arquivos.'
  }

  if (status === 403) {
    return 'Você não tem permissão para editar este relatório.'
  }

  if (status === 404) {
    return 'Relatório não encontrado. Recarregue a página e tente novamente.'
  }

  if (status >= 500) {
    return 'Erro no servidor. Os arquivos podem ter sido salvos. Recarregue a página para verificar.'
  }

  const msg = getErrorMessage(error)
  return msg !== 'An unexpected error occurred.'
    ? msg
    : 'Ocorreu um erro ao enviar os anexos. Tente novamente.'
}

export function ReportAttachmentsSection({
  record,
  existingAnexos,
  onAnexosChange,
  onUploadStart,
  onUploadEnd,
  isView,
}: Props) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    if (!record || !record.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Salve o relatório como rascunho primeiro para adicionar anexos.',
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    const newFiles = Array.from(e.target.files)
    const validFiles: File[] = []
    let rejectedCount = 0

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: 'Formato inválido',
          description: `O arquivo "${file.name}" não é suportado. Use PDF, JPG ou PNG.`,
          variant: 'destructive',
        })
        rejectedCount++
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Arquivo muito grande',
          description: `O arquivo "${file.name}" excede o limite de 10MB.`,
          variant: 'destructive',
        })
        rejectedCount++
        continue
      }
      validFiles.push(file)
    }

    const totalNewSize = validFiles.reduce((sum, f) => sum + f.size, 0)
    if (totalNewSize > MAX_TOTAL_SIZE) {
      toast({
        title: 'Tamanho total excedido',
        description: `O tamanho total dos arquivos (${(totalNewSize / 1024 / 1024).toFixed(1)}MB) excede o limite de ${MAX_TOTAL_SIZE / 1024 / 1024}MB. Envie menos arquivos por vez.`,
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    const totalFileCount = existingAnexos.length + validFiles.length
    if (totalFileCount > MAX_FILES) {
      toast({
        title: 'Limite de arquivos excedido',
        description: `Você pode ter no máximo ${MAX_FILES} anexos. Este relatório já possui ${existingAnexos.length}.`,
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    if (validFiles.length > 0) {
      setIsUploading(true)
      onUploadStart()
      try {
        const formData = new FormData()
        validFiles.forEach((file) => {
          formData.append('anexos+', file)
        })

        const updatedRecord = await pb.collection('relatorios').update(record.id, formData)
        onAnexosChange(updatedRecord.anexos || [])
        toast({
          title: 'Sucesso',
          description: `${validFiles.length} arquivo(s) enviado(s) com sucesso.`,
        })
      } catch (error: any) {
        console.error('Upload error', error)
        const message = getUploadErrorMessage(error)
        toast({
          title: 'Erro no upload',
          description: message,
          variant: 'destructive',
        })

        try {
          const freshRecord = await pb.collection('relatorios').getOne(record.id)
          if (freshRecord.anexos && freshRecord.anexos.length > existingAnexos.length) {
            onAnexosChange(freshRecord.anexos)
            toast({
              title: 'Atenção',
              description:
                'Alguns arquivos podem ter sido salvos mesmo com o erro. A lista foi atualizada.',
            })
          }
        } catch {
          // ignore fetch error
        }
      } finally {
        setIsUploading(false)
        onUploadEnd()
        e.target.value = ''
      }
    } else {
      e.target.value = ''
    }
  }

  const handleDelete = async (fileName: string) => {
    if (!record || !record.id) return

    setIsDeleting(fileName)
    onUploadStart()
    try {
      const formData = new FormData()
      formData.append('anexos-', fileName)
      const updatedRecord = await pb.collection('relatorios').update(record.id, formData)
      onAnexosChange(updatedRecord.anexos || [])
      toast({
        title: 'Arquivo removido',
        description: 'O anexo foi removido com sucesso.',
      })
    } catch (error: any) {
      console.error('Delete error', error)
      const message = getUploadErrorMessage(error)
      toast({
        title: 'Erro ao remover',
        description: message,
        variant: 'destructive',
      })

      try {
        const freshRecord = await pb.collection('relatorios').getOne(record.id)
        onAnexosChange(freshRecord.anexos || [])
      } catch {
        // ignore fetch error
      }
    } finally {
      setIsDeleting(null)
      onUploadEnd()
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b">
        <h3 className="text-lg font-semibold text-primary">Anexos Técnicos</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Certificados de calibração, ARTs e outros documentos relevantes.
        </p>
      </div>

      {!isView && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${!record?.id ? 'bg-muted/50 opacity-60' : 'bg-muted/20 hover:bg-muted/40'}`}
        >
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">Arraste e solte arquivos aqui</p>
          <p className="text-xs text-muted-foreground mb-4">
            PDF, PNG, JPG (máx. 10MB por arquivo, 100MB total)
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={!record?.id || isUploading}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Selecionar Arquivos'
            )}
          </Button>
          {!record?.id && (
            <p className="text-xs text-amber-600 mt-3 font-medium text-center">
              Salve o relatório como rascunho primeiro para habilitar o envio de anexos.
            </p>
          )}
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            accept=".pdf,image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            disabled={!record?.id || isUploading}
          />
        </div>
      )}

      {existingAnexos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {existingAnexos.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Paperclip className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium truncate" title={name}>
                  {name}
                </span>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                {record && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={pb.files.getURL(record, name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="h-4 w-4 text-emerald-600" />
                    </a>
                  </Button>
                )}
                {!isView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive disabled:opacity-50"
                    disabled={isDeleting === name || isUploading}
                    onClick={() => handleDelete(name)}
                  >
                    {isDeleting === name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        isView && (
          <div className="text-center p-6 border rounded-lg bg-muted/20 text-muted-foreground text-sm">
            <FileWarning className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            Nenhum anexo disponível para este relatório.
          </div>
        )
      )}
    </div>
  )
}
