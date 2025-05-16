import fs from 'fs/promises'
import mammoth from 'mammoth'

export async function parseDocxOrPdf(path: string): Promise<string> {
  if (path.endsWith('.docx')) {
    const buffer = await fs.readFile(path)
    const { value } = await mammoth.extractRawText({ buffer })
    return value
  } else if (path.endsWith('.pdf')) {
    const buffer = await fs.readFile(path)

    // ✅ Dynamically load pdf-parse at runtime to avoid bundling issues
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  } else {
    return ''
  }
}
