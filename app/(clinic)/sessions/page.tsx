'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ClinicalSession } from '@/types'

async function fetchSessions() {
  const res = await fetch('/api/sessions')
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<ClinicalSession[]>
}

export default function SessionsPage() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sessões Clínicas</h1>
        <p className="text-muted-foreground">Prontuário e evolução dos pacientes</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Nenhuma sessão registrada ainda
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {(s.patient as { name: string } | undefined)?.name ?? 'Paciente'} — Sessão #{s.sessionNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(s.startTime), "dd/MM/yyyy HH:mm", { locale: ptBR })} —{' '}
                      {(s.physiotherapist as { name: string } | undefined)?.name ?? 'Fisioterapeuta'}
                    </p>
                  </div>
                  {s.painLevel !== null && s.painLevel !== undefined && (
                    <Badge variant={s.painLevel >= 7 ? 'destructive' : s.painLevel >= 4 ? 'default' : 'secondary'}>
                      Dor: {s.painLevel}/10
                    </Badge>
                  )}
                </div>
                {s.techniques.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.techniques.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                {s.evolution && (
                  <p className="text-sm mt-3 text-muted-foreground border-t pt-2">{s.evolution}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
