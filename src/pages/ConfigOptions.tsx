import { useState, useEffect } from 'react'
import {
  getOpcoesPadronizadas,
  createOpcao,
  deleteOpcao,
  OpcaoPadronizada,
} from '@/services/opcoes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Plus } from 'lucide-react'

export default function ConfigOptions() {
  const { toast } = useToast()
  const [opcoes, setOpcoes] = useState<OpcaoPadronizada[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoria, setSelectedCategoria] = useState<string>('fabricante')
  const [novoValor, setNovoValor] = useState('')

  const categorias = [
    { value: 'fabricante', label: 'Fabricante' },
    { value: 'corrente_nominal', label: 'Corrente Nominal' },
  ]

  const loadOpcoes = async () => {
    try {
      setLoading(true)
      const data = await getOpcoesPadronizadas()
      setOpcoes(data)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar opções', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOpcoes()
  }, [])

  const handleAdd = async () => {
    if (!novoValor.trim()) return
    try {
      await createOpcao({ categoria: selectedCategoria, valor: novoValor.trim() })
      setNovoValor('')
      loadOpcoes()
      toast({ title: 'Sucesso', description: 'Opção adicionada com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao adicionar opção', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteOpcao(id)
      loadOpcoes()
      toast({ title: 'Sucesso', description: 'Opção removida com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover opção', variant: 'destructive' })
    }
  }

  const filteredOpcoes = opcoes.filter((o) => o.categoria === selectedCategoria)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Opções Padronizadas</h2>
        <p className="text-muted-foreground">
          Gerencie as opções predefinidas para os campos dos relatórios.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-4 max-w-2xl">
        <div className="space-y-2 flex-1 w-full">
          <label className="text-sm font-medium">Categoria</label>
          <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1 w-full">
          <label className="text-sm font-medium">Novo Valor</label>
          <Input
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            placeholder="Digite o valor..."
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <div className="border rounded-md max-w-2xl bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">
            Carregando opções...
          </div>
        ) : filteredOpcoes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma opção cadastrada para esta categoria.
          </div>
        ) : (
          <ul className="divide-y">
            {filteredOpcoes.map((opcao) => (
              <li
                key={opcao.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{opcao.valor}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(opcao.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
