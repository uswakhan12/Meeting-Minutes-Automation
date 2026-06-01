import { useState } from 'react'
import { Loader2 } from 'lucide-react'

function formatCharacterCount(count) {
  return `${count.toLocaleString()} character${count === 1 ? '' : 's'}`
}

export default function TranscriptInput({ onSubmit, loading, error }) {
  const [transcript, setTranscript] = useState('')

  const characterCount = transcript.length
  const isEmpty = transcript.trim().length === 0
  const isDisabled = isEmpty || loading

  function handleSubmit(event) {
    event.preventDefault()
    if (isDisabled) return
    onSubmit(transcript)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="space-y-1.5">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your meeting transcript here..."
          disabled={loading}
          className="min-h-[200px] w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400/20"
          aria-label="Meeting transcript"
        />
        <p
          className="text-right text-xs text-slate-500 dark:text-slate-400"
          aria-live="polite"
        >
          {formatCharacterCount(characterCount)}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Analyze Meeting
      </button>
    </form>
  )
}
