import { useState } from 'react'
import { Plus, Edit, Trash2, Cpu } from 'lucide-react'
import { EquipmentItem } from '@/types/reports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EquipmentModal } from './EquipmentModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  equipments: EquipmentItem[]
  setEquipments: React.Dispatch<React.SetStateAction<EquipmentItem[]>>
  isView: boolean
}

export function EquipmentSection({ equipments, setEquipments, isView }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; index: number | null }>({
    open: false,
    index: null,
  })

  const handleSaveEquipment = (eq: EquipmentItem) => {
    if (editingIndex !== null) {
      const newList = [...equipments]
      newList[editingIndex] = { ...newList[editingIndex], ...eq }
      setEquipments(newList)
    } else {
      setEquipments([...equipments, eq])
    }
  }

  const handleDelete = () => {
    if (deleteDialog.index !== null) {
      const newList = [...equipments]
      const eq = newList[deleteDialog.index]
      if (eq.id) {
        newList[deleteDialog.index] = { ...eq, _delete: true }
      } else {
        newList.splice(deleteDialog.index, 1)
      }
      setEquipments(newList)
    }
    setDeleteDialog({ open: false, index: null })
  }

  const visibleEquipments = equipments
    .map((eq, i) => ({ eq, index: i }))
    .filter((x) => !x.eq._delete)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b mt-8">
        <h3 className="text-lg font-semibold text-primary">2. Equipamentos Inspecionados</h3>
        {!isView && (
          <Button
            onClick={() => {
              setEditingIndex(null)
              setModalOpen(true)
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar Equipamento
          </Button>
        )}
      </div>

      {visibleEquipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <Cpu className="h-10 w-10 mb-3 opacity-20" />
          <p>Nenhum equipamento adicionado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {visibleEquipments.map(({ eq, index }) => (
            <Card key={index} className="shadow-sm border-l-4 border-l-primary/60">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  <Badge variant="outline" className="bg-background">
                    {eq.tipo_equipamento}
                  </Badge>
                  {eq.dados_tecnicos.numero && (
                    <span className="text-muted-foreground">#{eq.dados_tecnicos.numero}</span>
                  )}
                </CardTitle>
                {!isView && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingIndex(index)
                        setModalOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteDialog({ open: true, index })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[13px]">
                {Object.entries(eq.dados_tecnicos).map(([key, val]) => {
                  if (!val && val !== 0) return null
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="font-semibold text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="truncate" title={String(val)}>
                        {val}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EquipmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveEquipment}
        initialData={editingIndex !== null ? equipments[editingIndex] : undefined}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, index: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este equipamento do relatório? A remoção só será
              definitiva após salvar o relatório.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
