import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT COUNT(*) as total FROM certificates`
    return NextResponse.json({ totalCertificates: Number(rows[0].total) })
  } catch {
    return NextResponse.json({ totalCertificates: 0 })
  }
}
