import React from 'react'
import { Paperclip, X, Download, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

interface Props {
  record: any
  existingAnexos: string[]
  filesToUpload: File[]
  filesToRemove: string[]
  onAddFiles: (files: File[]) => void
  onRemoveExisting: (name: string) => void
  onRemoveNew: (index: number) => void
  isView: boolean
}

export function ReportAttachmentsSection({
  record,
  existingAnexos,
  filesToUpload,
  filesToRemove,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
  isView,
}: Props) {
  const { toast } = useToast()

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files)
    const validFiles: File[] = []

    newFiles.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: 'Formato inválido',
          description: `O arquivo ${file.name} não é suportado. Use PDF, JPG ou PNG.`,
          variant: 'destructive',
        })
        return
      }
      if (file.size > MAX_SIZE) {
        toast({
          title: 'Arquivo muito grande',
          description: `O arquivo ${file.name} excede o limite de 10MB.`,
          variant: 'destructive',
        })
        return
      }
      validFiles.push(file)
    })

    if (validFiles.length > 0) {
      onAddFiles(validFiles)
    }

    e.target.value = ''
  }

  const currentExisting = existingAnexos.filter((name) => !filesToRemove.includes(name))
  const hasFiles = currentExisting.length > 0 || filesToUpload.length > 0

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b">
        <h3 className="text-lg font-semibold text-primary">Anexos Técnicos</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Certificados de calibração, ARTs e outros documentos relevantes.
        </p>
      </div>

      {!isView && (
        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">Arraste e solte arquivos aqui</p>
          <p className="text-xs text-muted-foreground mb-4">
            PDF, PNG, JPG (máx. 10MB por arquivo)
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Selecionar Arquivos
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            accept=".pdf,image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
          />
        </div>
      )}

      {hasFiles ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentExisting.map((name) => (
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
                    className="h-8 w-8 text-destructive"
                    onClick={() => onRemoveExisting(name)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filesToUpload.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3 border border-primary/20 rounded-lg bg-primary/5 shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Paperclip className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB (Pronto para envio)
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                {!isView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onRemoveNew(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        isView && (
          <div className="text-center p-6 border rounded-lg bg-muted/20 text-muted-foreground text-sm">
            Nenhum anexo disponível para este relatório.
          </div>
        )
      )}
    </div>
  )
}
