import { useEffect, useRef, useState } from 'react'
import TranscriptInput from './components/TranscriptInput.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import {
  ApiError,
  extractMeetingActions,
  NetworkError,
} from './lib/api.js'

function App() {
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  async function handleSubmit(text) {
    setTranscript(text)
    setLoading(true)
    setError(null)

    try {
      const data = await extractMeetingActions(text)
      setResult(data)
    } catch (err) {
      setResult(null)
      if (err instanceof NetworkError) {
        setError(
          'Connection problem: could not reach the server. Check your network and try again.',
        )
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(
          err instanceof Error ? err.message : 'Something went wrong.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Meeting → Actions
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Paste a transcript. Get decisions, owners, and deadlines — instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Reset
          </button>
        </header>

        <TranscriptInput
          transcript={transcript}
          onTranscriptChange={setTranscript}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        {result && (
          <div ref={resultsRef} className="border-t border-slate-200 pt-10 dark:border-slate-800">
            <ResultsPanel data={result} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
