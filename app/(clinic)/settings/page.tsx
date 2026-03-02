'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Check, Plus, Trash2, MapPin, Link, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useColorTheme, type ColorTheme } from '@/hooks/use-color-theme'
import type { ClinicSettings, Room } from '@/types'
import { cn } from '@/lib/utils'

const colorOptions: { value: ColorTheme; label: string; bg: string }[] = [
  { value: 'default', label: 'Preto',   bg: 'bg-[oklch(0.205_0_0)]' },
  { value: 'blue',    label: 'Azul',    bg: 'bg-[oklch(0.546_0.245_263)]' },
  { value: 'green',   label: 'Verde',   bg: 'bg-[oklch(0.527_0.154_150)]' },
  { value: 'purple',  label: 'Roxo',    bg: 'bg-[oklch(0.487_0.236_290)]' },
  { value: 'orange',  label: 'Laranja', bg: 'bg-[oklch(0.646_0.222_41)]'  },
  { value: 'pink',    label: 'Rosa',    bg: 'bg-[oklch(0.656_0.241_354)]' },
]

const durationOptions = [15, 30, 45, 60, 90, 120]

function generateHours() {
  const hours: string[] = []
  for (let h = 0; h <= 23; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`)
    hours.push(`${String(h).padStart(2, '0')}:30`)
  }
  return hours
}
const hourOptions = generateHours()

export default function SettingsPage() {
  const { data: sessionData } = useSession()
  const isAdmin = sessionData?.user?.role === 'ADMIN' || sessionData?.user?.role === 'SUPER_ADMIN'
  const { theme, setTheme } = useColorTheme()
  const queryClient = useQueryClient()

  /* ── Clinic settings ──────────────────────────────────────── */
  const { data: settings, isLoading: loadingSettings } = useQuery<ClinicSettings>({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: isAdmin,
  })

  const [sessionDuration, setSessionDuration] = useState('60')
  const [openingTime, setOpeningTime] = useState('08:00')
  const [closingTime, setClosingTime] = useState('18:00')

  useEffect(() => {
    if (settings) {
      setSessionDuration(String(settings.sessionDuration))
      setOpeningTime(settings.openingTime)
      setClosingTime(settings.closingTime)
    }
  }, [settings])

  const { mutate: saveSettings, isPending: savingSettings } = useMutation({
    mutationFn: async (data: Partial<ClinicSettings>) => {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] })
      toast.success('Configurações salvas!')
    },
    onError: () => toast.error('Erro ao salvar. Execute as migrações do banco.'),
  })

  /* ── Rooms ────────────────────────────────────────────────── */
  const { data: rooms = [], isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      if (!res.ok) return []
      return res.json()
    },
    enabled: isAdmin,
  })

  const [newRoomName, setNewRoomName] = useState('')

  const { mutate: createRoom, isPending: creatingRoom } = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setNewRoomName('')
      toast.success('Sala criada!')
    },
    onError: () => toast.error('Erro ao criar sala. Execute as migrações do banco.'),
  })

  const { mutate: deleteRoom } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Sala removida!')
    },
    onError: () => toast.error('Erro ao remover sala'),
  })

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie as preferências do sistema</p>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="w-full">
          <TabsTrigger value="appearance" className="flex-1">Aparência</TabsTrigger>
          {isAdmin && <TabsTrigger value="clinic" className="flex-1">Clínica</TabsTrigger>}
          {isAdmin && <TabsTrigger value="rooms" className="flex-1">Salas</TabsTrigger>}
          {isAdmin && <TabsTrigger value="booking" className="flex-1">Agendamento</TabsTrigger>}
        </TabsList>

        {/* ── Appearance ──────────────────────────────────────── */}
        <TabsContent value="appearance" className="mt-4 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle>Cor de destaque</CardTitle>
              <CardDescription>Escolha a cor principal da interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                      'hover:shadow-md hover:-translate-y-0.5',
                      'animate-in fade-in zoom-in-95',
                      theme === opt.value
                        ? 'border-primary ring-2 ring-primary/25 shadow-sm'
                        : 'border-border hover:border-muted-foreground/40',
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-transform',
                      'hover:scale-110',
                      opt.bg,
                    )}>
                      {theme === opt.value && (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Clinic settings ─────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="clinic" className="mt-4 animate-in fade-in duration-200">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da clínica</CardTitle>
                <CardDescription>Horário de funcionamento e duração das sessões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loadingSettings ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando…
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Duração padrão da sessão</Label>
                      <Select value={sessionDuration} onValueChange={setSessionDuration}>
                        <SelectTrigger className="w-52 transition-all hover:border-primary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              {d} minutos
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        O término do agendamento será calculado automaticamente.
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Abertura</Label>
                        <Select value={openingTime} onValueChange={setOpeningTime}>
                          <SelectTrigger className="transition-all hover:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {hourOptions.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fechamento</Label>
                        <Select value={closingTime} onValueChange={setClosingTime}>
                          <SelectTrigger className="transition-all hover:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {hourOptions.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        saveSettings({
                          sessionDuration: Number(sessionDuration),
                          openingTime,
                          closingTime,
                        })
                      }
                      disabled={savingSettings}
                      className="transition-all hover:shadow-md"
                    >
                      {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar configurações
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Rooms ───────────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="rooms" className="mt-4 animate-in fade-in duration-200">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Salas de atendimento
                </CardTitle>
                <CardDescription>
                  Gerencie as salas disponíveis para agendamentos. Duas consultas não podem
                  ocorrer na mesma sala no mesmo horário.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add room */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da sala (ex: Sala 1, Sala Azul…)"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newRoomName.trim()) {
                        createRoom(newRoomName.trim())
                      }
                    }}
                    className="transition-all hover:border-primary/50 focus:border-primary"
                  />
                  <Button
                    onClick={() => { if (newRoomName.trim()) createRoom(newRoomName.trim()) }}
                    disabled={creatingRoom || !newRoomName.trim()}
                    className="shrink-0 transition-all hover:shadow-md"
                  >
                    {creatingRoom
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Plus className="h-4 w-4" />
                    }
                  </Button>
                </div>

                <Separator />

                {/* List */}
                {loadingRooms ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando salas…
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    Nenhuma sala cadastrada ainda
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {rooms.map((room, i) => (
                      <li
                        key={room.id}
                        className={cn(
                          'flex items-center justify-between px-3 py-2.5 rounded-lg',
                          'border bg-muted/30 transition-all duration-150',
                          'hover:bg-muted/60 hover:shadow-sm',
                          'animate-in fade-in slide-in-from-left-2',
                        )}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{room.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => deleteRoom(room.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {/* ── Booking Link ─────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="booking" className="mt-4 animate-in fade-in duration-200">
            <BookingLinkSection slug={sessionData?.user?.clinicSlug ?? ''} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function BookingLinkSection({ slug }: { slug: string }) {
  const bookingUrl = `https://${slug}.fisiohub.com.br/agendar`

  function copyLink() {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      toast.success('Link copiado!')
    }).catch(() => {
      toast.error('Não foi possível copiar o link')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          Link de Agendamento Online
        </CardTitle>
        <CardDescription>
          Compartilhe este link com seus pacientes para que eles possam agendar consultas online.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm font-mono text-muted-foreground flex-1 truncate">{bookingUrl}</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyLink} variant="outline" className="flex-1 transition-all hover:shadow-md">
            <Copy className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
          <Button
            onClick={() => window.open(bookingUrl, '_blank')}
            variant="outline"
            className="flex-1 transition-all hover:shadow-md"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pacientes que agendam por este link recebem um email de confirmação automaticamente.
        </p>
      </CardContent>
    </Card>
  )
}
