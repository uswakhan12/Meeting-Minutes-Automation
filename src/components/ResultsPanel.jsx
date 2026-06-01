import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  HelpCircle,
  Mail,
  MessageSquare,
  User,
} from 'lucide-react'
import SectionHeader from './SectionHeader.jsx'
import { formatEmailMessage, formatSlackMessage } from '../lib/formatResults.js'

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function isEmptyResult(data) {
  return !data.decisions?.length && !data.action_items?.length
}

const CONFIDENCE_STYLES = {
  high: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30',
  medium:
    'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30',
  low: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/30',
}

function ConfidenceBadge({ confidence }) {
  const key = confidence?.toLowerCase()
  const styles =
    CONFIDENCE_STYLES[key] ??
    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400'

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${styles}`}
    >
      {confidence ?? 'unknown'} confidence
    </span>
  )
}

function UrgencyBadge({ reason }) {
  return (
    <span
      title={reason ?? undefined}
      className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-orange-600/20 ring-inset dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-500/30"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
      Urgent
    </span>
  )
}

function collectAttentionItems(data) {
  const items = [...(data.warnings ?? [])]
  for (const item of data.action_items ?? []) {
    if (item.flag) items.push(item.flag)
  }
  return items
}

function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default function ResultsPanel({ data }) {
  const [activeTab, setActiveTab] = useState('slack')
  const [copiedTab, setCopiedTab] = useState(null)
  const copyTimeoutRef = useRef(null)

  if (!data) return null

  const attentionItems = collectAttentionItems(data)
  const showAttention = attentionItems.length > 0
  const showEmptyState = isEmptyResult(data)
  const slackText = formatSlackMessage(data)
  const email = formatEmailMessage(data)
  const activeText =
    activeTab === 'slack'
      ? slackText
      : `Subject: ${email.subject}\n\n${email.body}`

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await copyToClipboard(activeText)
      setCopiedTab(activeTab)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopiedTab(null), 2000)
    } catch {
      setCopiedTab(null)
    }
  }

  return (
    <div className="w-full space-y-8">
      {showEmptyState && (
        <div className="flex gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6 dark:border-slate-700 dark:bg-slate-800/30">
          <HelpCircle
            className="h-5 w-5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              No clear decisions or actions found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Was this a status update or social meeting? Try a transcript with
              explicit assignments and deadlines.
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <SectionHeader
          icon={ClipboardList}
          title="Summary"
          description="High-level recap of the meeting"
        />
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-4 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
          {data.summary || 'No summary provided.'}
        </div>
      </section>

      {showAttention && (
        <section className="space-y-3">
          <SectionHeader
            icon={AlertTriangle}
            title="Needs your attention"
            description="Ambiguous items and flags"
            accent="amber"
          />
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
              {attentionItems.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {data.decisions?.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            icon={CheckCircle2}
            title="Decisions"
            description="Agreements reached in the meeting"
            accent="indigo"
          />
          <ul className="space-y-2">
            {data.decisions.map((decision, index) => (
              <li
                key={`${decision.text}-${index}`}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  {decision.text}
                </p>
                <ConfidenceBadge confidence={decision.confidence} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader
          icon={CheckCircle2}
          title="Action items"
          description="Tasks with owners and deadlines"
        />
        {data.action_items?.length ? (
          <ul className="space-y-3">
            {data.action_items.map((item, index) => (
              <li
                key={`${item.task}-${index}`}
                className={`overflow-hidden rounded-xl border bg-white dark:bg-slate-900/50 ${
                  item.is_urgent
                    ? 'border-orange-200/80 shadow-sm shadow-orange-100/50 dark:border-orange-900/40 dark:shadow-none'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                {item.is_urgent && (
                  <div className="h-0.5 bg-gradient-to-r from-orange-400 to-amber-400" />
                )}
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {item.task}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.is_urgent && (
                        <UrgencyBadge reason={item.urgency_reason} />
                      )}
                      <ConfidenceBadge confidence={item.confidence} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetaRow
                      icon={User}
                      label="Owner"
                      value={
                        item.owner ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.owner}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/10 dark:bg-red-950/40 dark:text-red-300">
                            Unassigned
                          </span>
                        )
                      }
                    />
                    <MetaRow
                      icon={Calendar}
                      label="Deadline"
                      value={
                        item.deadline ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.deadline}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-300">
                            Needs clarification
                          </span>
                        )
                      }
                    />
                  </div>

                  {item.is_urgent && item.urgency_reason && (
                    <p className="mt-3 rounded-lg bg-orange-50/80 px-3 py-2 text-xs text-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
                      {item.urgency_reason}
                    </p>
                  )}
                  {item.flag && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                      {item.flag}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No action items identified.
          </p>
        )}
      </section>

      {data.open_questions?.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            icon={HelpCircle}
            title="Open questions"
            description="Unresolved topics to follow up on"
          />
          <ul className="space-y-2">
            {data.open_questions.map((q, index) => (
              <li
                key={`${q.text}-${index}`}
                className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"
              >
                {q.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4 border-t border-slate-100 pt-8 dark:border-slate-800">
        <SectionHeader
          icon={MessageSquare}
          title="Export follow-up"
          description="Copy a formatted message for your team"
        />

        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === 'slack'}
            icon={MessageSquare}
            onClick={() => setActiveTab('slack')}
          >
            Slack
          </TabButton>
          <TabButton
            active={activeTab === 'email'}
            icon={Mail}
            onClick={() => setActiveTab('email')}
          >
            Email
          </TabButton>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
            <span className="text-xs font-medium text-slate-400">
              Preview
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              {copiedTab === activeTab ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
            {activeText}
          </pre>
        </div>
      </section>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-slate-50/80 px-3 py-2 dark:bg-slate-800/40">
      <Icon
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 text-sm">{value}</div>
      </div>
    </div>
  )
}
