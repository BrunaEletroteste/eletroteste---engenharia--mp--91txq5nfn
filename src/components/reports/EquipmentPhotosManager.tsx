import { useState, useRef } from 'react'
import { ImagePlus, Trash2, Loader2, AlertCircle, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { EquipmentItem } from '@/types/reports'
import pb from '@/lib/pocketbase/client'

function PhotoItem({
  foto,
  url,
  isView,
  onDelete,
}: {
  foto: string
  url: string
  isView: boolean
  onDelete: () => void
}) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative group aspect-square rounded-md overflow-hidden border bg-muted flex items-center justify-center">
      {hasError ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
          <ImageOff className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-[10px] leading-tight">Imagem não encontrada</span>
        </div>
      ) : (
        <img
          src={url}
          alt="Foto do equipamento"
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      )}
      {!isView && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Remover foto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

interface Props {
  equipment: EquipmentItem
  index: number
  setEquipments: React.Dispatch<React.SetStateAction<EquipmentItem[]>>
  isView: boolean
  reportId?: string
}

export function EquipmentPhotosManager({ equipment, index, setEquipments, isView }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fotos = equipment.fotos || []

  // Equipamentos sem ID são novos (ainda não foram salvos no backend).
  // Não podemos anexar arquivos via API até que o registro exista.
  if (!equipment.id) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/10 rounded-md border border-dashed text-center px-4">
        <AlertCircle className="h-10 w-10 mb-3 opacity-50 text-amber-500" />
        <p>
          Salve o relatório primeiro para poder anexar fotos a este equipamento recém-adicionado.
        </p>
      </div>
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()

      // No PocketBase, para manter os arquivos existentes ao fazer upload de novos,
      // precisamos enviar novamente os nomes dos arquivos que queremos manter.
      fotos.forEach((foto) => {
        formData.append('fotos', foto)
      })

      for (let i = 0; i < files.length; i++) {
        formData.append('fotos', files[i])
      }

      const record = await pb.collection('equipamentos_relatorio').update(equipment.id!, formData)

      setEquipments((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], fotos: record.fotos }
        return next
      })

      toast({
        title: 'Fotos enviadas',
        description: 'As fotos foram anexadas com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar fotos',
        description:
          error.message ||
          'Ocorreu um erro ao enviar as fotos. Verifique o limite de 5MB por imagem.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (foto: string) => {
    try {
      // Para excluir um arquivo no PocketBase via JSON, enviamos o array apenas com os itens restantes.
      const updatedFotos = fotos.filter((f) => f !== foto)
      const record = await pb.collection('equipamentos_relatorio').update(equipment.id!, {
        fotos: updatedFotos,
      })

      setEquipments((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], fotos: record.fotos }
        return next
      })

      toast({
        title: 'Foto removida',
        description: 'A foto foi removida com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao remover foto',
        description: error.message || 'Ocorreu um erro ao remover a foto.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      {!isView && (
        <div className="flex justify-end">
          <input
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Adicionar Fotos
          </Button>
        </div>
      )}

      {fotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <ImagePlus className="h-10 w-10 mb-3 opacity-20" />
          <p>Nenhuma foto anexada para este equipamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {fotos.map((foto) => {
            const url = pb.files.getUrl(
              {
                id: equipment.id!,
                collectionId: 'equipamentos_relatorio',
                collectionName: 'equipamentos_relatorio',
              } as any,
              foto,
            )
            return (
              <PhotoItem
                key={foto}
                foto={foto}
                url={url}
                isView={isView}
                onDelete={() => handleDelete(foto)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
