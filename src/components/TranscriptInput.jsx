import { Loader2, RotateCcw, Sparkles } from 'lucide-react'

const SAMPLE_TRANSCRIPTS = [
  {
    id: 'formal',
    label: 'Formal minutes',
    description: 'Clear decisions, owners, and deadlines',
    text: `Product Launch Sync — June 1, 2026
Attendees: Sarah (PM), James (Eng), Priya (Design), Marcus (Sales)

Agenda: Q2 launch readiness

DECISIONS
- Approved: New pricing model starts Q3 (not Q2).
- Approved: Guest checkout is out of scope for this release.

ACTION ITEMS
- James: Complete auth refactor by Friday, June 6 (blocks dashboard).
- Sarah: Own pricing page updates; live before launch on June 15.
- Priya: Deliver settings wireframes by EOD Wednesday, June 4.
- Marcus: Coordinate API documentation with James; target April 1 completion.

OPEN ITEMS
- Enterprise discount structure — deferred to next week's pricing review.

Next meeting: June 8, 10:00 AM.`,
  },
  {
    id: 'messy',
    label: 'Messy notes',
    description: 'Informal, partial assignments, mixed Roman Urdu/English',
    text: `ok so pricing page - sarah? yeah before launch for sure
john might do emails idk nobody assigned
we're doing new pricing Q3 thats final i think
james said auth thing by friday top priority
enterprise discount still TBD ran out of time
priya wireframes wed?
kisi ne API docs ka zikr kiya lekin owner clear nahi`,
  },
  {
    id: 'no-decisions',
    label: 'Status update only',
    description: 'No firm decisions or action items — expect empty state',
    text: `Weekly standup — June 1, 2026

Sarah: Gave a quick update on the roadmap deck. No blockers.
James: Still working through the auth branch. Same as yesterday.
Priya: Reviewing feedback on mockups. Will share when ready.
Marcus: Travel next week; async on Slack.

General discussion about how busy the week is. No new commitments.
Team agreed the offsite lunch was good.

Meeting ended 5 minutes early.`,
  },
]

function formatCharacterCount(count) {
  return `${count.toLocaleString()} character${count === 1 ? '' : 's'}`
}

function excerpt(text, maxLength = 140) {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLength) return oneLine
  return `${oneLine.slice(0, maxLength).trim()}…`
}

export default function TranscriptInput({
  transcript,
  onTranscriptChange,
  onSubmit,
  onReset,
  showReset,
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
        <label
          htmlFor="transcript"
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          Paste or type your meeting notes
        </label>
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

      {showReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Clear & try another transcript
        </button>
      )}

      <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Sample transcripts
        </p>
        <ul className="space-y-2">
          {SAMPLE_TRANSCRIPTS.map((sample) => (
            <li key={sample.id}>
              <button
                type="button"
                onClick={() => onTranscriptChange(sample.text)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {sample.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                  {sample.description}
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {excerpt(sample.text)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  )
}
