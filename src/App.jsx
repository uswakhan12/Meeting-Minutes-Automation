import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ClipboardList, RotateCcw, Sparkles } from 'lucide-react'
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
  const [showScrollTop, setShowScrollTop] = useState(false)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    setTranscript('')
    setResult(null)
    setError(null)
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const canReset = Boolean(transcript.trim() || result || error)

  const urgentCount =
    result?.action_items?.filter((item) => item.is_urgent).length ?? 0

  return (
    <div className="relative min-h-svh overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Meeting Action Agent
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                  Meeting → Actions
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Paste a transcript. Get decisions, owners, deadlines, and
                  shareable follow-ups—in seconds.
                </p>
              </div>
            </div>
            {canReset && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </header>

        <main className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/50 backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles
                className="h-4 w-4 text-indigo-500 dark:text-indigo-400"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Transcript
              </h2>
            </div>
            <TranscriptInput
              transcript={transcript}
              onTranscriptChange={setTranscript}
              onSubmit={handleSubmit}
              onReset={handleReset}
              showReset={canReset}
              loading={loading}
              error={error}
            />
          </section>

          {result && (
            <section
              ref={resultsRef}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/50 backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none"
            >
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Analysis complete
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Meeting insights
                  </h2>
                </div>
                <dl className="flex flex-wrap gap-3">
                  <StatPill
                    label="Decisions"
                    value={result.decisions?.length ?? 0}
                  />
                  <StatPill
                    label="Actions"
                    value={result.action_items?.length ?? 0}
                  />
                  {urgentCount > 0 && (
                    <StatPill
                      label="Urgent"
                      value={urgentCount}
                      variant="urgent"
                    />
                  )}
                </dl>
              </div>
              <ResultsPanel data={result} />
            </section>
          )}
        </main>

        <footer className="mt-12 text-center text-xs text-slate-400 dark:text-slate-500">
          Structured extraction · Confidence & urgency signals · Export ready
        </footer>
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function StatPill({ label, value, variant }) {
  const urgent =
    variant === 'urgent'
      ? 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300'
      : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300'

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center ${urgent}`}
    >
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      <dt className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </dt>
    </div>
  )
}

export default App
