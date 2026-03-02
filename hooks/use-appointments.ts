'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Appointment } from '@/types'

async function fetchAppointments(params?: { date?: string; from?: string; to?: string; physiotherapistId?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.date) searchParams.set('date', params.date)
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)
  if (params?.physiotherapistId) searchParams.set('physiotherapistId', params.physiotherapistId)
  const res = await fetch(`/api/appointments?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch appointments')
  return res.json() as Promise<Appointment[]>
}

async function createAppointment(data: Partial<Appointment>) {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create appointment')
  return res.json() as Promise<Appointment>
}

async function updateAppointment(id: string, data: Partial<Appointment>) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update appointment')
  return res.json() as Promise<Appointment>
}

async function deleteAppointment(id: string) {
  const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete appointment')
}

export function useAppointments(params?: { date?: string; from?: string; to?: string; physiotherapistId?: string }) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => fetchAppointments(params),
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      updateAppointment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
