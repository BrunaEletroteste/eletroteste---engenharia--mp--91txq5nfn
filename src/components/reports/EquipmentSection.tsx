import { useState } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Cpu,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { EquipmentItem, ParecerItem } from '@/types/reports'
import { getEquipmentFields, FieldDef } from '@/lib/equipment-templates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EquipmentModal } from './EquipmentModal'
import { EquipmentTestsManager } from './EquipmentTestsManager'
import { EquipmentPhotosManager } from './EquipmentPhotosManager'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
      const maxOrdem = equipments.reduce((max, item) => Math.max(max, item.ordem || 0), 0)
      setEquipments([...equipments, { ...eq, ordem: maxOrdem + 1 }])
    }
  }

  const handleMoveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setEquipments((prev) => {
      const next = [...prev]
      let prevIdx = index - 1
      while (prevIdx >= 0 && next[prevIdx]._delete) prevIdx--
      if (prevIdx >= 0) {
        const temp = next[index]
        next[index] = next[prevIdx]
        next[prevIdx] = temp

        const tempOrdem = next[index].ordem || index + 1
        next[index].ordem = next[prevIdx].ordem || prevIdx + 1
        next[prevIdx].ordem = tempOrdem
      }
      return next
    })
  }

  const handleMoveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setEquipments((prev) => {
      const next = [...prev]
      let nextIdx = index + 1
      while (nextIdx < next.length && next[nextIdx]._delete) nextIdx++
      if (nextIdx < next.length) {
        const temp = next[index]
        next[index] = next[nextIdx]
        next[nextIdx] = temp

        const tempOrdem = next[index].ordem || index + 1
        next[index].ordem = next[nextIdx].ordem || nextIdx + 1
        next[nextIdx].ordem = tempOrdem
      }
      return next
    })
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
  let seqCounter = 1
  const visibleEquipments = equipments
    .map((eq, i) => {
      const seq = !eq._delete ? seqCounter++ : 0
      return { eq, index: i, seq }
    })
    .filter((x) => {
      if (x.eq._delete) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const tipo = x.eq.tipo_equipamento || ''
      const numero = x.eq.dados_tecnicos?.numero || x.eq.dados_tecnicos?.identificacao || ''
      const subestacao = x.eq.dados_tecnicos?.subestacao || ''
      const circuito = x.eq.dados_tecnicos?.circuito || ''

      return (
        tipo.toLowerCase().includes(q) ||
        String(numero).toLowerCase().includes(q) ||
        String(subestacao).toLowerCase().includes(q) ||
        String(circuito).toLowerCase().includes(q)
      )
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
              placeholder="Buscar equipamento..."
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
          <p>Nenhum equipamento encontrado com esta busca</p>
        </div>
      ) : (
        <div className="pt-2">
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="space-y-3"
          >
            {visibleEquipments.map(({ eq, index, seq }, i) => (
              <AccordionItem
                id={`equipamento-${index}`}
                key={index}
                value={i.toString()}
                className="border-l-4 border-l-primary/60 border rounded-md shadow-sm overflow-hidden bg-card transition-all duration-300"
              >
                <div className="flex items-center justify-between pr-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <AccordionTrigger className="hover:no-underline px-3 py-3 flex-1 justify-start gap-3 text-left [&>svg:last-child]:hidden group">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </TooltipTrigger>
                      <TooltipContent>Expandir/Recolher</TooltipContent>
                    </Tooltip>

                    <Badge
                      variant="outline"
                      className="bg-primary/5 border-primary/20 text-primary px-2 py-0.5 text-xs font-mono shrink-0"
                    >
                      #{seq}
                    </Badge>
                    <span className="font-semibold text-foreground flex-1 break-words">
                      {[
                        eq.tipo_equipamento,
                        eq.dados_tecnicos?.numero || eq.dados_tecnicos?.identificacao,
                        eq.dados_tecnicos?.subestacao,
                        eq.dados_tecnicos?.circuito,
                      ]
                        .filter(Boolean)
                        .join(' — ')}
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
                        className={cn('ml-auto mr-2', {
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
                    <div className="flex items-center gap-1 ml-2 bg-background/50 shadow-sm p-1 rounded-md border border-border/60">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary z-10 relative disabled:opacity-30"
                            disabled={!!searchQuery || seq === 1}
                            onClick={(e) => handleMoveUp(e, index)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover para cima</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary z-10 relative disabled:opacity-30"
                            disabled={!!searchQuery || seq === activeEquipmentsCount}
                            onClick={(e) => handleMoveDown(e, index)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover para baixo</TooltipContent>
                      </Tooltip>

                      <div className="w-[1px] h-6 bg-border/60 mx-1"></div>

                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10 relative"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDialog({ open: true, index })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
                <AccordionContent className="bg-background">
                  <Tabs defaultValue="dados" className="w-full">
                    <TabsList className="w-full justify-start rounded-none px-4 py-2 h-auto space-x-2 bg-muted border-b overflow-x-auto shadow-inner">
                      <TabsTrigger
                        value="dados"
                        className="px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-md border-b-4 border-transparent data-[state=active]:border-b-primary data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-800 rounded-sm transition-colors duration-200"
                      >
                        Dados Técnicos
                      </TabsTrigger>
                      <TabsTrigger
                        value="testes"
                        className="px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-md border-b-4 border-transparent data-[state=active]:border-b-primary data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-800 rounded-sm transition-colors duration-200"
                      >
                        Testes Elétricos
                      </TabsTrigger>
                      <TabsTrigger
                        value="fotos"
                        className="px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-md border-b-4 border-transparent data-[state=active]:border-b-primary data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-800 rounded-sm transition-colors duration-200"
                      >
                        Fotos
                      </TabsTrigger>
                      <TabsTrigger
                        value="parecer"
                        className="px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-md border-b-4 border-transparent data-[state=active]:border-b-primary data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-800 rounded-sm transition-colors duration-200"
                      >
                        Parecer Técnico
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dados" className="p-4 focus-visible:outline-none">
                      {(() => {
                        const fields = getEquipmentFields(eq.tipo_equipamento)

                        const isFuseField = (f: FieldDef) => {
                          const name = f.name.toLowerCase()
                          const label = f.label.toLowerCase()
                          return (
                            name.includes('fusivel') ||
                            name.includes('fusiveis') ||
                            label.includes('fusível') ||
                            label.includes('fusíveis')
                          )
                        }

                        const fieldsWithoutSectionAndFuse = fields.filter(
                          (f) => !f.section && !isFuseField(f),
                        )
                        const fuseFields = fields.filter((f) => isFuseField(f))
                        const sections = Array.from(
                          new Set(fields.filter((f) => f.section).map((f) => f.section)),
                        )

                        const renderField = (f: FieldDef) => {
                          if (
                            f.dependsOn &&
                            eq.dados_tecnicos[f.dependsOn.field] !== f.dependsOn.value
                          ) {
                            return null
                          }
                          const val = eq.dados_tecnicos[f.name]
                          if (val === undefined || val === null || val === '') return null
                          let displayVal = val
                          if (typeof val === 'boolean') displayVal = val ? 'Sim' : 'Não'
                          return (
                            <div key={f.name} className="flex flex-col">
                              <span className="font-semibold text-muted-foreground">{f.label}</span>
                              <span
                                className="truncate font-medium text-foreground"
                                title={String(displayVal)}
                              >
                                {String(displayVal)}
                              </span>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-[13px] p-3 bg-muted/10 rounded-md border border-dashed">
                              {fieldsWithoutSectionAndFuse.map(renderField)}
                            </div>

                            {sections.length > 0 && (
                              <div className="space-y-3">
                                {sections.map((section) => {
                                  const sectionFields = fields.filter((f) => f.section === section)
                                  const leftFields = sectionFields.filter(
                                    (f) => f.column === 'left',
                                  )
                                  const rightFields = sectionFields.filter(
                                    (f) => f.column === 'right',
                                  )

                                  return (
                                    <div
                                      key={section!}
                                      className="rounded-lg border border-border bg-card p-4 shadow-sm"
                                    >
                                      <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {section}
                                      </h3>
                                      {leftFields.length > 0 || rightFields.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                          <div className="space-y-2">
                                            {section === 'Ajustes de Corrente' && (
                                              <h4 className="text-[11px] font-bold uppercase text-primary border-b pb-1 mb-2">
                                                Fase
                                              </h4>
                                            )}
                                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px]">
                                              {leftFields.map(renderField)}
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            {section === 'Ajustes de Corrente' && (
                                              <h4 className="text-[11px] font-bold uppercase text-primary border-b pb-1 mb-2">
                                                Neutro
                                              </h4>
                                            )}
                                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px]">
                                              {rightFields.map(renderField)}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-[13px]">
                                          {sectionFields.map(renderField)}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {fuseFields.length > 0 &&
                              fuseFields.some((f) => {
                                if (
                                  f.dependsOn &&
                                  eq.dados_tecnicos[f.dependsOn.field] !== f.dependsOn.value
                                )
                                  return false
                                const val = eq.dados_tecnicos[f.name]
                                return val !== undefined && val !== null && val !== ''
                              }) && (
                                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                  <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Informações dos Fusíveis
                                  </h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-[13px]">
                                    {fuseFields.map(renderField)}
                                  </div>
                                </div>
                              )}
                          </div>
                        )
                      })()}
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

                    <TabsContent value="fotos" className="p-4 focus-visible:outline-none">
                      <EquipmentPhotosManager
                        equipment={eq}
                        index={index}
                        setEquipments={setEquipments}
                        isView={isView}
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
