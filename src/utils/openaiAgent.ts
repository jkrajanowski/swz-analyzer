import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = 'asst_Cr0SNqhxVss0RMvINshWd27h'

export async function callOpenAIAgent(swz: string, opz: string): Promise<any> {
  const thread = await openai.beta.threads.create()

  // ✅ Limit text to avoid hitting the GPT-4o token-per-minute cap
  const maxInputChars = 12000
  const trimmedSWZ = swz.slice(0, maxInputChars)
  const trimmedOPZ = opz?.slice(0, maxInputChars) || ''

  const fullPrompt = `
Jesteś prawnikiem-konsultantem wyspecjalizowanym w zamówieniach publicznych.

Otrzymujesz:
  • plik SWZ (DOCX lub PDF, tekst wprowadza użytkownik),
  • opcjonalnie plik OPZ (opis przedmiotu zamówienia),
  • plik wiedzy „szablon_klauzule_umowy_SWZ.json” – tabela przykładów
    klauzul potencjalnie abuzywnych wraz z kategorią, rodzajem zagrożenia,
    oceną ryzyka i uzasadnieniem prawnym.

Twoje zadanie (wykonuj w tej kolejności):

1. **Przeskanuj** cały tekst SWZ, paragraf po paragrafie.
2. Dla każdego paragrafu sprawdź, czy **semantycznie** odpowiada któremuś z przykładów w pliku wiedzy (nie muszą być identyczne słowa).
3. Jeżeli klauzula pasuje, dodaj ją do **raportu** i wypełnij pola:
   • \`clause\` – dokładny cytat z SWZ,  
   • \`category\` – wartość z kolumny „Kategoria”,  
   • \`threat\` – z kolumny „Rodzaj zagrożenia” („Proste”, „Trudne”, „Informacyjne”),  
   • \`risk\` – z kolumny „Ocena ryzyka”,  
   • \`why\` – uzasadnienie z kolumny „Podstawa prawna / uzasadnienie”,  
   • \`advice\` – krótka rekomendacja:
       – jeśli \`threat\` = Trudne lub Informacyjne → zaproponuj konsultację ze specjalistą,  
       – w pozostałych przypadkach podaj praktyczną wskazówkę,  
   • \`confidence\` – liczba od **0 do 1**, określająca jak bardzo jesteś pewny, że to klauzula abuzywna (1 = pewność, 0.5 = wątpliwe, <0.3 = raczej niepasuje).
4. Jeśli do oceny klauzuli potrzebny jest kontekst, wykorzystaj tekst OPZ; jeśli to wciąż niewystarczające, ustaw \`confidence\` < 0.5 i w \`advice\` dodaj „wymaga analizy ręcznej”.
5. Jeśli **nie** znajdziesz żadnych podejrzanych klauzul, zamiast pustej tablicy zwróć JSON z komunikatem:

\`\`\`json
{
  "message": "Nie znaleziono żadnych potencjalnie abuzywnych klauzul w analizowanym dokumencie."
}
\`\`\`

❗ Odpowiedz **wyłącznie poprawnym JSON-em**, bez wprowadzeń, bez komentarzy i bez Markdowna.

SWZ:
${trimmedSWZ}

${trimmedOPZ ? `OPZ:\n${trimmedOPZ}` : ''}
`



  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: fullPrompt,
  })

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
  })

  // ✅ Poll for completion
  while (true) {
    const status = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    if (status.status === 'completed') break
    if (['failed', 'expired', 'cancelled'].includes(status.status)) {
      console.error('🛑 Assistant run failed')
      console.error('Status:', status.status)
      console.error('Last error:', status.last_error)
      return {
        error: `Run failed: ${status.last_error?.message ?? 'unknown error'}`,
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const messages = await openai.beta.threads.messages.list(thread.id)
  const latest = messages.data[0]

  const content = latest.content.find((c) => c.type === 'text') as any
  const text = content?.text?.value?.trim()

  console.log('🔎 Assistant raw reply:', text)

  try {
    // Remove markdown-style ```json ... ``` if present
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return parsed
  } catch (err) {
    return {
      error: '❌ Failed to parse JSON response from assistant',
      raw: text,
    }
  }
}
