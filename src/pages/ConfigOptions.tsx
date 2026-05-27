import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
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
import { useRealtime } from '@/hooks/use-realtime'

export default function ConfigOptions() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [opcoes, setOpcoes] = useState<OpcaoPadronizada[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoria, setSelectedCategoria] = useState<string>('fabricante')
  const [novoValor, setNovoValor] = useState('')

  const KNOWN_CATEGORIES = [
    { value: 'fabricante', label: 'Fabricante' },
    { value: 'corrente_nominal', label: 'Corrente Nominal' },
    { value: 'classe_isolamento', label: 'Classe de Isolamento' },
    { value: 'potencia_simetrica', label: 'Potência Simétrica' },
    { value: 'capacidade_ruptura', label: 'Capacidade de Ruptura' },
    { value: 'rele_minima_tensao', label: 'Relé de Mínima Tensão' },
    { value: 'rele_abertura', label: 'Relé de Abertura' },
    { value: 'rele_fechamento', label: 'Relé de Fechamento' },
    { value: 'motorizacao', label: 'Motorização' },
    { value: 'relacao', label: 'Relação' },
    { value: 'Classe de Precisão', label: 'Classe de Precisão' },
    { value: 'Tensão', label: 'Tensão' },
  ]

  const dbCategorias = Array.from(new Set(opcoes.map((o) => o.categoria)))
  const categorias = KNOWN_CATEGORIES.map((k) => k)

  dbCategorias.forEach((dc) => {
    if (!categorias.find((c) => c.value === dc)) {
      categorias.push({ value: dc, label: dc })
    }
  })

  categorias.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

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

  useRealtime('opcoes_padronizadas', () => {
    loadOpcoes()
  })

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

  const compareOpcoes = (a: string, b: string) => {
    const parseStr = (s: string) => {
      // Matches Brazilian formatted numbers at the start of the string
      // e.g., "1.000", "1.000,50", "10", "1,5", "-5.000,99"
      const match = s.trim().match(/^(-?\d{1,3}(?:\.\d{3})*|-?\d+)(?:,\d+)?/)
      if (match) {
        const numStr = match[0].replace(/\./g, '').replace(',', '.')
        const num = parseFloat(numStr)
        const rest = s.trim().substring(match[0].length).trim()
        return { num, rest, isNum: true }
      }
      return { num: 0, rest: s.trim(), isNum: false }
    }

    const parsedA = parseStr(a)
    const parsedB = parseStr(b)

    if (parsedA.isNum && parsedB.isNum) {
      if (parsedA.num !== parsedB.num) {
        return parsedA.num - parsedB.num
      }
      // If numbers are equal, fallback to comparing the rest of the string
      return parsedA.rest.localeCompare(parsedB.rest, 'pt-BR', {
        numeric: true,
        sensitivity: 'base',
      })
    }

    // Numbers come before strings
    if (parsedA.isNum && !parsedB.isNum) return -1
    if (!parsedA.isNum && parsedB.isNum) return 1

    // Standard string comparison with numeric and locale awareness for non-numbers at the start
    return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' })
  }

  const filteredOpcoes = opcoes
    .filter((o) => o.categoria === selectedCategoria)
    .sort((a, b) => compareOpcoes(a.valor, b.valor))

  if (user && user.tipo_acesso !== 'admin') {
    return <Navigate to="/" replace />
  }

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
