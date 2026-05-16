import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { rows } = await sql`SELECT COUNT(*) as total FROM certificates`
    return NextResponse.json({ totalCertificates: Number(rows[0].total) })
  } catch {
    return NextResponse.json({ totalCertificates: 0 })
  }
}
