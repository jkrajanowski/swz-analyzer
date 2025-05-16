import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { parseDocxOrPdf } from '@/utils/parseFiles'
import { callOpenAIAgent } from '@/utils/openaiAgent'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile } from 'fs/promises'

export const dynamic = 'force-dynamic' // Ensure it's not cached on Vercel

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const swzFile = formData.get('swz') as File
  const opzFile = formData.get('opz') as File | null

  if (!swzFile) {
    return NextResponse.json({ error: 'Missing SWZ file' }, { status: 400 })
  }

  const bufferFromFile = async (file: File): Promise<Buffer> => {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  const saveFile = async (file: File, name: string) => {
    const buffer = await bufferFromFile(file)
    const filePath = join(tmpdir(), `${Date.now()}-${name}`)
    await writeFile(filePath, buffer)
    return filePath
  }

  const swzPath = await saveFile(swzFile, swzFile.name)
  const opzPath = opzFile ? await saveFile(opzFile, opzFile.name) : null

  const swzText = await parseDocxOrPdf(swzPath)
  const opzText = opzPath ? await parseDocxOrPdf(opzPath) : ''
  console.log("SWZ text length:", swzText.length)
  console.log("OPZ text length:", opzText?.length)

  const result = await callOpenAIAgent(swzText, opzText)
  console.log("AI response:", result)

  return NextResponse.json(result)
}
