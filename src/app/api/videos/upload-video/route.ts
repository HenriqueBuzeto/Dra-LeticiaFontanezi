import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Upload não disponível nesta versão. Use URL do vídeo.' },
    { status: 501 }
  )
}
