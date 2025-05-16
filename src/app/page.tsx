'use client'

import { useState } from 'react'

export default function Home() {
  const [swz, setSwz] = useState<File | null>(null)
  const [opz, setOpz] = useState<File | null>(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!swz) return
    setLoading(true)

    const formData = new FormData()
    formData.append('swz', swz)
    if (opz) formData.append('opz', opz)

    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    })

    const json = await res.json()
    setResult(JSON.stringify(json, null, 2))
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-700">
        <h1 className="text-3xl font-bold mb-6 text-center">Analizator SWZ</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col items-center">
            <label className="mb-2 font-medium">Plik SWZ (PDF lub DOCX):</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setSwz(e.target.files?.[0] || null)}
              className="bg-zinc-800 border border-zinc-600 rounded px-3 py-2 file:mr-2 file:rounded file:border-none file:bg-blue-700 file:text-white file:px-4 file:py-2"
            />
          </div>

          <div className="flex flex-col items-center">
            <label className="mb-2 font-medium">Plik OPZ (opcjonalnie):</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setOpz(e.target.files?.[0] || null)}
              className="bg-zinc-800 border border-zinc-600 rounded px-3 py-2 file:mr-2 file:rounded file:border-none file:bg-blue-700 file:text-white file:px-4 file:py-2"
            />
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 transition px-6 py-2 text-white rounded font-semibold disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              Analizuję...
              </div>
) : 'Analizuj'}

          </button>
        </div>

        {result && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Wyniki</h2>
            {(() => {
              try {
                const parsed = JSON.parse(result)

                if ('message' in parsed) {
                  return (
                    <div className="bg-zinc-800 p-4 rounded border border-zinc-600 text-center">
                      {parsed.message}
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    {parsed.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-zinc-900 p-4 rounded shadow border border-zinc-700"
                      >
                        <p><strong>🔍 Klauzula:</strong> {item.clause}</p>
                        <p><strong>📂 Kategoria:</strong> {item.category}</p>
                        <p><strong>⚠️ Zagrożenie:</strong> {item.threat}</p>
                        <p><strong>📉 Ryzyko:</strong> {item.risk}</p>
                        <p><strong>📜 Uzasadnienie:</strong> {item.why}</p>
                        <p><strong>💡 Rekomendacja:</strong> {item.advice}</p>
                        <p><strong>📊 Pewność:</strong> {(item.confidence * 100).toFixed(0)}%</p>
                      </div>
                    ))}
                  </div>
                )
              } catch (e) {
                return (
                  <textarea
                    value={result}
                    readOnly
                    className="w-full h-80 p-2 border border-red-500 rounded text-red-300 bg-zinc-900"
                  />
                )
              }
            })()}
          </div>
        )}
      </div>
    </main>
  )
}
