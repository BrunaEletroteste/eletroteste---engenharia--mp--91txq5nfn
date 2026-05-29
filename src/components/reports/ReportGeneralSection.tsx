import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface Props {
  isView: boolean
  existingFotos: string[]
  onExistingFotosChange: (f: string[]) => void
  newFotos: File[]
  onNewFotosChange: (f: File[]) => void
  record: any
}

export function ReportGeneralSection({
  isView,
  existingFotos,
  onExistingFotosChange,
  newFotos,
  onNewFotosChange,
  record,
}: Props) {
  const { control } = useFormContext()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      onNewFotosChange([...newFotos, ...filesArray])
    }
  }

  const removeNewFoto = (idx: number) => {
    onNewFotosChange(newFotos.filter((_, i) => i !== idx))
  }

  const removeExistingFoto = (foto: string) => {
    onExistingFotosChange(existingFotos.filter((f) => f !== foto))
  }

  return (
    <div className="space-y-4 border rounded-xl p-6 bg-card shadow-sm relative">
      <h3 className="text-lg font-semibold border-b pb-2">Informações Gerais / Estrutura</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="temperatura_ambiente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperatura Ambiente (°C)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  disabled={isView}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="umidade_relativa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Umidade Relativa do Ar (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  disabled={isView}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="parecer_geral"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Parecer Técnico Geral (Estrutura)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Observações sobre estrutura, tapetes, EPIs, etc."
                {...field}
                value={field.value ?? ''}
                disabled={isView}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2 mt-4">
        <FormLabel>Fotos Gerais da Estrutura</FormLabel>
        {!isView && (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="max-w-sm"
            />
          </div>
        )}

        {existingFotos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {existingFotos.map((foto) => (
              <div key={foto} className="relative group rounded-md border p-1 bg-muted">
                <img
                  src={pb.files.getURL(record, foto)}
                  alt="Foto Estrutura"
                  className="w-20 h-20 object-cover rounded"
                />
                {!isView && (
                  <button
                    type="button"
                    onClick={() => removeExistingFoto(foto)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {newFotos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {newFotos.map((file, idx) => (
              <div key={idx} className="relative group rounded-md border p-1 bg-muted">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Nova Foto"
                  className="w-20 h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeNewFoto(idx)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
