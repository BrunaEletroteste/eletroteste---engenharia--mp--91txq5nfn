import { useState } from 'react'
import { Plus, Edit, Trash2, Cpu, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { EquipmentItem, ParecerItem } from '@/types/reports'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EquipmentModal } from './EquipmentModal'
import { EquipmentTestsManager } from './EquipmentTestsManager'
import { ParecerForm } from './ParecerForm'
import { useFormContext, useWatch } from 'react-hook-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const { control } = useFormContext()
  const { toast } = useToast()

  const clienteId = useWatch({ control, name: 'cliente_id' })
  const reportDate = useWatch({ control, name: 'data_execucao' })

  const [searchQuery, setSearchQuery] = useState('')
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

  const activeEquipmentsCount = equipments.filter((eq) => !eq._delete).length
  const visibleEquipments = equipments
    .map((eq, i) => ({ eq, index: i }))
    .filter((x) => {
      if (x.eq._delete) return false
      if (!searchQuery) return true
      const numero = x.eq.dados_tecnicos?.numero
      if (!numero) return false
      return String(numero).toLowerCase().includes(searchQuery.toLowerCase())
    })

  const toggleAll = () => {
    if (expandedItems.length === visibleEquipments.length && visibleEquipments.length > 0) {
      setExpandedItems([])
    } else {
      setExpandedItems(visibleEquipments.map((_, i) => i.toString()))
    }
  }

  const handleUpdateParecer = (index: number, p: ParecerItem) => {
    setEquipments((prev) => {
      const next = [...prev]
      const oldP = next[index].parecer
      if (oldP?.parecer !== p.parecer && p.parecer) {
        toast({
          title: 'Parecer registrado',
          description: 'O status do parecer foi atualizado temporariamente.',
        })
      }
      next[index] = { ...next[index], parecer: p }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b mt-8 gap-4">
        <h3 className="text-lg font-semibold text-primary whitespace-nowrap">
          2. Equipamentos Inspecionados
        </h3>

        {activeEquipmentsCount > 0 && (
          <div className="flex-1 w-full max-w-md relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipamento pelo número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
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

      {activeEquipmentsCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <Cpu className="h-10 w-10 mb-3 opacity-20" />
          <p>Nenhum equipamento adicionado ainda.</p>
        </div>
      ) : visibleEquipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <Search className="h-10 w-10 mb-3 opacity-20" />
          <p>Nenhum equipamento encontrado com este número</p>
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
                id={`equipamento-${index}`}
                key={index}
                value={i.toString()}
                className="border-l-4 border-l-primary/60 border rounded-md shadow-sm overflow-hidden bg-card transition-all duration-300"
              >
                <div className="flex items-center justify-between pr-4 bg-muted/20">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 flex-1 justify-start gap-3">
                    <span className="font-semibold text-foreground">
                      {eq.tipo_equipamento} — {eq.dados_tecnicos.numero || 'Sem identificação'}
                    </span>
                    {eq.parecer?.parecer && (
                      <Badge
                        variant={
                          eq.parecer.parecer === 'Conforme'
                            ? 'default'
                            : eq.parecer.parecer === 'Possui Ressalvas'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className={cn('ml-auto mr-4', {
                          'bg-emerald-100 text-emerald-800 hover:bg-emerald-100':
                            eq.parecer.parecer === 'Conforme',
                          'bg-[#FEF3C7] text-yellow-800 hover:bg-[#FEF3C7]':
                            eq.parecer.parecer === 'Possui Ressalvas',
                          'bg-[#FEE2E2] text-red-800 hover:bg-[#FEE2E2]':
                            eq.parecer.parecer === 'Não Conforme',
                        })}
                      >
                        {eq.parecer.parecer}
                      </Badge>
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
                <AccordionContent className="bg-background">
                  <Tabs defaultValue="dados" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none px-4 h-auto space-x-6 bg-muted/5 overflow-x-auto">
                      <TabsTrigger
                        value="dados"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                      >
                        Dados Técnicos
                      </TabsTrigger>
                      <TabsTrigger
                        value="testes"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                      >
                        Testes Elétricos
                      </TabsTrigger>
                      <TabsTrigger
                        value="parecer"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                      >
                        Parecer Técnico
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dados" className="p-4 focus-visible:outline-none">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-[13px] p-2 bg-muted/10 rounded-md border border-dashed">
                        {Object.entries(eq.dados_tecnicos).map(([key, val]) => {
                          if (val === undefined || val === null || val === '') return null
                          let displayVal = val
                          if (typeof val === 'boolean') displayVal = val ? 'Sim' : 'Não'
                          return (
                            <div key={key} className="flex flex-col">
                              <span className="font-semibold text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span
                                className="truncate font-medium text-foreground"
                                title={String(displayVal)}
                              >
                                {String(displayVal)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="testes" className="p-4 focus-visible:outline-none">
                      <EquipmentTestsManager
                        equipment={eq}
                        equipmentIndex={index}
                        displayIndex={i + 1}
                        setEquipments={setEquipments}
                        isView={isView}
                        clienteId={clienteId}
                        reportDate={reportDate}
                      />
                    </TabsContent>

                    <TabsContent value="parecer" className="p-4 focus-visible:outline-none">
                      <ParecerForm
                        equipment={eq}
                        isView={isView}
                        clienteId={clienteId}
                        onUpdate={(p) => handleUpdateParecer(index, p)}
                      />
                    </TabsContent>
                  </Tabs>
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
