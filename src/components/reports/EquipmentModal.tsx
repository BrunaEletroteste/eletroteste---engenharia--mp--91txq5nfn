import { useState, useEffect } from 'react'
import { EquipmentItem } from '@/types/reports'
import { getEquipmentFields, FieldDef, EQUIPMENT_TYPES } from '@/lib/equipment-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (eq: EquipmentItem) => void
  initialData?: EquipmentItem
}

export function EquipmentModal({ open, onOpenChange, onSave, initialData }: Props) {
  const { toast } = useToast()
  const [tipo, setTipo] = useState<string>('')
  const [dados, setDados] = useState<Record<string, any>>({})
  const [fields, setFields] = useState<FieldDef[]>([])

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTipo(initialData.tipo_equipamento)
        setDados(initialData.dados_tecnicos || {})
        setFields(getEquipmentFields(initialData.tipo_equipamento))
      } else {
        setTipo('')
        setDados({})
        setFields([])
      }
    }
  }, [open, initialData])

  const handleTipoChange = (val: string) => {
    setTipo(val)
    setFields(getEquipmentFields(val))
    setDados({})
  }

  const handleFieldChange = (name: string, val: any) => {
    setDados((prev) => ({ ...prev, [name]: val }))
  }

  const handleSave = () => {
    if (!tipo) {
      toast({
        title: 'Atenção',
        description: 'Selecione o tipo de equipamento.',
        variant: 'destructive',
      })
      return
    }

    if (!dados.subestacao || !dados.numero) {
      toast({
        title: 'Atenção',
        description: 'Subestação e Número são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    onSave({ tipo_equipamento: tipo, dados_tecnicos: dados })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Equipamento' : 'Adicionar Equipamento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>
              Tipo de Equipamento <span className="text-destructive">*</span>
            </Label>
            <Select value={tipo} onValueChange={handleTipoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de equipamento" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t pt-5 mt-2">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label>
                    {field.label}
                    {['subestacao', 'numero'].includes(field.name) && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>

                  {field.type === 'select' && field.options ? (
                    <Select
                      value={dados[field.name]?.toString() || ''}
                      onValueChange={(v) => handleFieldChange(field.name, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={dados[field.name] || ''}
                      onChange={(e) =>
                        handleFieldChange(
                          field.name,
                          field.type === 'number' ? Number(e.target.value) : e.target.value,
                        )
                      }
                      placeholder={`Insira ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Equipamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
