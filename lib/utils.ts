import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Para campos de data pura (dueDate, birthDate etc.) salvos como UTC midnight,
 *  reconstrói a data usando os componentes UTC para evitar que o offset UTC-3
 *  desloque o dia para trás no browser brasileiro. */
function toLocalDate(date: Date | string): Date {
  const d = new Date(date)
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }
  return d
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy") {
  return format(toLocalDate(date), pattern, { locale: ptBR })
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })
}

export function formatTime(date: Date | string) {
  return format(new Date(date), "HH:mm", { locale: ptBR })
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function formatCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

