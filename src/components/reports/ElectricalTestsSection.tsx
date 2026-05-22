import { useFormContext, useWatch } from 'react-hook-form'
import { EquipmentItem } from '@/types/reports'
import { EquipmentTestsManager } from './EquipmentTestsManager'

interface ElectricalTestsSectionProps {
  equipments: EquipmentItem[]
  setEquipments: React.Dispatch<React.SetStateAction<EquipmentItem[]>>
  isView: boolean
}

export function ElectricalTestsSection({
  equipments,
  setEquipments,
  isView,
}: ElectricalTestsSectionProps) {
  const { control } = useFormContext()
  const clienteId = useWatch({ control, name: 'cliente_id' })
  const reportDate = useWatch({ control, name: 'data_execucao' })

  const validEquipments = equipments.filter((e) => !e._delete)

  if (validEquipments.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-muted/20 border border-dashed rounded-lg">
        <p className="text-muted-foreground">
          Nenhum equipamento adicionado. Adicione equipamentos na aba "Geral" primeiro.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {validEquipments.map((eq, index) => {
        const originalIndex = equipments.findIndex((e) => e === eq)
        return (
          <EquipmentTestsManager
            key={eq.id || `eq-${originalIndex}`}
            equipment={eq}
            equipmentIndex={originalIndex}
            displayIndex={index + 1}
            setEquipments={setEquipments}
            isView={isView}
            clienteId={clienteId}
            reportDate={reportDate}
          />
        )
      })}
    </div>
  )
}
