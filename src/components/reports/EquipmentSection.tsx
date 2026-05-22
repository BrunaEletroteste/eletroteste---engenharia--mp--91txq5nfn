import { useState } from 'react'
import { Plus, Edit, Trash2, Cpu, ChevronDown, ChevronUp } from 'lucide-react'
import { EquipmentItem } from '@/types/reports'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EquipmentModal } from './EquipmentModal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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

  const [expandedItems, setExpandedItems] = useState<string[]>([])
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

  const toggleAll = () => {
    if (expandedItems.length === visibleEquipments.length && visibleEquipments.length > 0) {
      setExpandedItems([])
    } else {
      setExpandedItems(visibleEquipments.map((_, i) => i.toString()))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b mt-8">
        <h3 className="text-lg font-semibold text-primary">2. Equipamentos Inspecionados</h3>
        <div className="flex gap-2 items-center">
          {visibleEquipments.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll} className="hidden sm:flex">
              {expandedItems.length === visibleEquipments.length ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" /> Recolher Todos
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" /> Expandir Todos
                </>
              )}
            </Button>
          )}
          {!isView && (
            <Button
              onClick={() => {
                setEditingIndex(null)
                setModalOpen(true)
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />{' '}
              <span className="hidden sm:inline">Adicionar Equipamento</span>
            </Button>
          )}
        </div>
      </div>

      {visibleEquipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <Cpu className="h-10 w-10 mb-3 opacity-20" />
          <p>Nenhum equipamento adicionado ainda.</p>
        </div>
      ) : (
        <div className="pt-2">
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="space-y-3"
          >
            {visibleEquipments.map(({ eq, index }, i) => (
              <AccordionItem
                key={index}
                value={i.toString()}
                className="border-l-4 border-l-primary/60 border rounded-md shadow-sm overflow-hidden bg-card"
              >
                <div className="flex items-center justify-between pr-4 bg-muted/20">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 flex-1 justify-start gap-3">
                    <Badge variant="outline" className="bg-background">
                      {eq.tipo_equipamento}
                    </Badge>
                    {eq.dados_tecnicos.numero && (
                      <span className="text-muted-foreground font-semibold">
                        #{eq.dados_tecnicos.numero}
                      </span>
                    )}
                  </AccordionTrigger>
                  {!isView && (
                    <div className="flex gap-1 items-center ml-2 border-l pl-2 border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary z-10 relative"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingIndex(index)
                          setModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive z-10 relative"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteDialog({ open: true, index })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <AccordionContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-[13px] border-t bg-background">
                  {Object.entries(eq.dados_tecnicos).map(([key, val]) => {
                    if (val === undefined || val === null || val === '') return null
                    // format boolean fields
                    let displayVal = val
                    if (typeof val === 'boolean') displayVal = val ? 'Sim' : 'Não'
                    return (
                      <div key={key} className="flex flex-col">
                        <span className="font-semibold text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="truncate" title={String(displayVal)}>
                          {String(displayVal)}
                        </span>
                      </div>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
