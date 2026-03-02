import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET not set')
  return new TextEncoder().encode(secret)
}

export async function signAppointmentToken(
  appointmentId: string,
  clinicSlug: string,
): Promise<string> {
  return new SignJWT({ appointmentId, clinicSlug })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyAppointmentToken(
  token: string,
): Promise<{ appointmentId: string; clinicSlug: string }> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as { appointmentId: string; clinicSlug: string }
}
