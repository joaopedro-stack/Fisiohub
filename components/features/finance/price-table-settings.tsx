'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Acompanhamento',
  DISCHARGE: 'Alta',
  RETURN: 'Retorno',
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface PriceEntry {
  id: string
  name: string
  type: string | null
  price: number
  isActive: boolean
}

export function PriceTableSettings() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<string>('none')
  const [newPrice, setNewPrice] = useState('')

  const { data: entries = [], isLoading } = useQuery<PriceEntry[]>({
    queryKey: ['price-table'],
    queryFn: async () => {
      const res = await fetch('/api/price-table')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const { mutate: createEntry, isPending: creating } = useMutation({
    mutationFn: async (data: { name: string; type?: string; price: number }) => {
      const res = await fetch('/api/price-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-table'] })
      setNewName('')
      setNewType('none')
      setNewPrice('')
      toast.success('Entrada criada!')
    },
    onError: () => toast.error('Erro ao criar entrada'),
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/price-table/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-table'] })
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const { mutate: deleteEntry } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/price-table/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-table'] })
      toast.success('Entrada removida!')
    },
    onError: () => toast.error('Erro ao remover entrada'),
  })

  function handleCreate() {
    if (!newName.trim() || !newPrice) return
    const price = parseFloat(newPrice)
    if (isNaN(price) || price < 0) {
      toast.error('Valor inválido')
      return
    }
    createEntry({
      name: newName.trim(),
      type: newType === 'none' ? undefined : newType,
      price,
    })
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input
            placeholder="Ex: Sessão de Fisioterapia"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            className="transition-all hover:border-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="w-44 transition-all hover:border-primary/50">
              <SelectValue placeholder="Tipo (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            className="w-32 transition-all hover:border-primary/50"
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={creating || !newName.trim() || !newPrice}
          className="shrink-0 transition-all hover:shadow-md"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-20" />
          Nenhum preço cadastrado ainda
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, i) => (
            <li
              key={entry.id}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg',
                'border bg-muted/30 transition-all duration-150',
                'hover:bg-muted/60 hover:shadow-sm',
                'animate-in fade-in slide-in-from-left-2',
                !entry.isActive && 'opacity-50',
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{entry.name}</p>
                  {entry.type && (
                    <p className="text-xs text-muted-foreground">{TYPE_LABELS[entry.type] ?? entry.type}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-sm font-semibold tabular-nums">{formatBRL(entry.price)}</span>
                <Badge variant={entry.isActive ? 'default' : 'secondary'} className="text-xs hidden sm:inline-flex">
                  {entry.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground transition-all"
                  onClick={() => toggleActive({ id: entry.id, isActive: !entry.isActive })}
                  title={entry.isActive ? 'Desativar' : 'Ativar'}
                >
                  {entry.isActive
                    ? <ToggleRight className="h-4 w-4 text-primary" />
                    : <ToggleLeft className="h-4 w-4" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={() => deleteEntry(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
