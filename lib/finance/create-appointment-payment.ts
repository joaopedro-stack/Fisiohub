import { getTenantPrisma } from '@/lib/tenant-prisma'

type TenantPrisma = ReturnType<typeof getTenantPrisma>

interface PaymentInput {
  amount: number
  method: string
  notes?: string | null
  paidAt?: Date
}

/**
 * Registers a payment for an appointment.
 * Creates an Invoice (or reuses existing) + Payment atomically.
 * Updates Appointment.paymentStatus and invoiceId.
 */
export async function createAppointmentPayment(
  prisma: TenantPrisma,
  appointmentId: string,
  input: PaymentInput,
  userId: string,
) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } })
  if (!appointment) throw new Error('Agendamento não encontrado')

  const appt = appointment as unknown as {
    status: string
    invoiceId: string | null
    patientId: string
    paymentValue: number | null
  }

  if (['CANCELLED', 'NO_SHOW'].includes(appt.status)) {
    throw new Error('Não é possível registrar pagamento para consulta cancelada ou faltante')
  }

  return await (prisma as unknown as { $transaction: (fn: (tx: TenantPrisma) => Promise<unknown>) => Promise<unknown> })
    .$transaction(async (tx: TenantPrisma) => {
      let invoiceId = appt.invoiceId
      let invoice: unknown

      if (invoiceId) {
        invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { payments: true },
        })
        if (!invoice) invoiceId = null
      }

      if (!invoiceId) {
        invoice = await tx.invoice.create({
          data: {
            patientId: appt.patientId,
            totalAmount: input.amount,
            issuedAt: new Date(),
            updatedAt: new Date(),
          } as never,
          include: { payments: true },
        })
        invoiceId = (invoice as { id: string }).id

        await tx.appointment.update({
          where: { id: appointmentId },
          data: { invoiceId, updatedAt: new Date() } as never,
        })

        await tx.financialAuditLog.create({
          data: {
            entityType: 'Invoice',
            entityId: invoiceId,
            action: 'CREATE',
            newValue: { patientId: appt.patientId, totalAmount: input.amount, source: 'appointment', appointmentId },
            changedBy: userId,
            changedAt: new Date(),
          } as never,
        })
      }

      const inv = invoice as { id: string; status: string; totalAmount: unknown; payments: { amount: unknown; isRefund: boolean }[] }

      if (inv.status === 'CANCELED') throw new Error('A fatura vinculada está cancelada')

      const payment = await tx.payment.create({
        data: {
          invoiceId: inv.id,
          amount: input.amount,
          method: input.method,
          paidAt: input.paidAt ?? new Date(),
          notes: input.notes,
          updatedAt: new Date(),
        } as never,
      })

      // Recalculate net paid including new payment
      const allPayments = [...inv.payments, { amount: input.amount, isRefund: false }]
      const paidSum = allPayments.filter((p) => !p.isRefund).reduce((s, p) => s + Number(p.amount), 0)
      const refundSum = allPayments.filter((p) => p.isRefund).reduce((s, p) => s + Number(p.amount), 0)
      const netPaid = paidSum - refundSum
      const totalAmount = Number(inv.totalAmount)

      const isFullyPaid = netPaid >= totalAmount

      if (isFullyPaid && inv.status !== 'PAID') {
        await tx.invoice.update({
          where: { id: inv.id },
          data: { status: 'PAID', paidAt: new Date(), updatedAt: new Date() } as never,
        })
        await tx.financialAuditLog.create({
          data: {
            entityType: 'Invoice',
            entityId: inv.id,
            action: 'STATUS_CHANGE',
            oldValue: { status: inv.status },
            newValue: { status: 'PAID' },
            changedBy: userId,
            changedAt: new Date(),
          } as never,
        })
      }

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentStatus: isFullyPaid ? 'PAID' : 'PENDING',
          paymentMethod: input.method,
          paymentValue: input.amount,
          invoiceId: inv.id,
          updatedAt: new Date(),
        } as never,
      })

      await tx.financialAuditLog.create({
        data: {
          entityType: 'Payment',
          entityId: (payment as { id: string }).id,
          action: 'CREATE',
          newValue: { invoiceId: inv.id, amount: input.amount, method: input.method, source: 'appointment', appointmentId },
          changedBy: userId,
          changedAt: new Date(),
        } as never,
      })

      return { invoice: inv, payment }
    })
}

/**
 * Creates an insurance (convênio) Invoice for an appointment.
 * Does NOT create a Payment — payment is registered when the insurer pays.
 */
export async function createInsuranceInvoice(
  prisma: TenantPrisma,
  appointmentId: string,
  input: { amount: number; patientId: string },
  userId: string,
) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } })
  if (!appointment) throw new Error('Agendamento não encontrado')

  const appt = appointment as unknown as { invoiceId: string | null }
  if (appt.invoiceId) return null // Already has invoice — idempotent

  const invoice = await prisma.invoice.create({
    data: {
      patientId: input.patientId,
      totalAmount: input.amount,
      issuedAt: new Date(),
      isInsurance: true,
      insuranceBilledAmount: input.amount,
      insuranceExpectedAmount: input.amount,
      insuranceStatus: 'BILLED',
      updatedAt: new Date(),
    } as never,
  })

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { invoiceId: invoice.id, updatedAt: new Date() } as never,
  })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'CREATE',
      newValue: { patientId: input.patientId, totalAmount: input.amount, isInsurance: true, source: 'appointment', appointmentId },
      changedBy: userId,
      changedAt: new Date(),
    } as never,
  })

  return invoice
}

/**
 * Creates a zero-value Invoice marked as PAID for a waived appointment.
 */
export async function createWaivedInvoice(
  prisma: TenantPrisma,
  appointmentId: string,
  patientId: string,
  userId: string,
) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } })
  if (!appointment) throw new Error('Agendamento não encontrado')

  const appt = appointment as unknown as { invoiceId: string | null }
  if (appt.invoiceId) return null

  const invoice = await prisma.invoice.create({
    data: {
      patientId,
      totalAmount: 0,
      issuedAt: new Date(),
      status: 'PAID',
      paidAt: new Date(),
      notes: 'Consulta isenta',
      updatedAt: new Date(),
    } as never,
  })

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { invoiceId: invoice.id, updatedAt: new Date() } as never,
  })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'CREATE',
      newValue: { patientId, totalAmount: 0, status: 'PAID', waived: true, source: 'appointment', appointmentId },
      changedBy: userId,
      changedAt: new Date(),
    } as never,
  })

  return invoice
}
