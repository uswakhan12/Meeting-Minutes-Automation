import { FileText, Loader2, Sparkles } from 'lucide-react'

const SAMPLE_TRANSCRIPT =
  "Alright so we've decided we're going with the new pricing model starting Q3. Sarah can you own the updated pricing page on the website? We need that done before the launch. John mentioned he'd look into the email campaign but nothing concrete. We still haven't decided on the discount structure for enterprise. Meeting ran long, let's pick that up next time."

function formatCharacterCount(count) {
  return `${count.toLocaleString()} character${count === 1 ? '' : 's'}`
}

export default function TranscriptInput({
  transcript,
  onTranscriptChange,
  onSubmit,
  loading,
  error,
}) {
  const characterCount = transcript.length
  const isEmpty = transcript.trim().length === 0
  const isDisabled = isEmpty || loading

  function handleSubmit(event) {
    event.preventDefault()
    if (isDisabled) return
    onSubmit(transcript)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="transcript"
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Paste or type your meeting notes
          </label>
          <button
            type="button"
            onClick={() => onTranscriptChange(SAMPLE_TRANSCRIPT)}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <FileText className="h-3 w-3" aria-hidden="true" />
            Load sample
          </button>
        </div>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Paste your meeting transcript here — notes, Zoom export, or bullet points all work…"
          disabled={loading}
          className="min-h-[220px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm leading-relaxed text-slate-900 shadow-inner shadow-slate-100/50 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/20"
          aria-label="Meeting transcript"
        />
        <p
          className="text-right text-xs tabular-nums text-slate-400 dark:text-slate-500"
          aria-live="polite"
        >
          {formatCharacterCount(characterCount)}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
        >
          <span className="font-semibold">Error</span>
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:focus:ring-offset-slate-900"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? 'Analyzing…' : 'Analyze Meeting'}
      </button>
    </form>
  )
}
