import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
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
  high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  low: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
}

function ConfidenceBadge({ confidence }) {
  const key = confidence?.toLowerCase()
  const styles = CONFIDENCE_STYLES[key] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {confidence ?? 'unknown'}
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

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border border-b-0 border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          No clear decisions or actions were found. Was this a status update or
          social meeting?
        </div>
      )}

      {/* Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Summary
        </h2>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
          {data.summary || 'No summary provided.'}
        </div>
      </section>

      {/* Warnings / Flags */}
      {showAttention && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Needs your attention
          </h2>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <ul className="list-inside list-disc space-y-1 text-sm text-amber-900 dark:text-amber-200">
              {attentionItems.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Action Items */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Action Items
        </h2>
        {data.action_items?.length ? (
          <ul className="space-y-3">
            {data.action_items.map((item, index) => (
              <li
                key={`${item.task}-${index}`}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.task}
                  </p>
                  <ConfidenceBadge confidence={item.confidence} />
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Owner:</dt>
                    <dd>
                      {item.owner ? (
                        <span className="text-slate-800 dark:text-slate-200">
                          {item.owner}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/50 dark:text-red-300">
                          ⚠ No owner assigned
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Deadline:</dt>
                    <dd>
                      {item.deadline ? (
                        <span className="text-slate-800 dark:text-slate-200">
                          {item.deadline}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          ⚠ Needs clarification
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
                {item.flag && (
                  <p className="mt-2 text-xs italic text-amber-700 dark:text-amber-400">
                    {item.flag}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No action items identified.
          </p>
        )}
      </section>

      {/* Export tabs */}
      <section className="space-y-0 border-t border-slate-200 pt-8 dark:border-slate-700">
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          <TabButton
            active={activeTab === 'slack'}
            onClick={() => setActiveTab('slack')}
          >
            Slack Format
          </TabButton>
          <TabButton
            active={activeTab === 'email'}
            onClick={() => setActiveTab('email')}
          >
            Email Format
          </TabButton>
        </div>

        <div className="rounded-b-lg rounded-tr-lg border border-t-0 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {copiedTab === activeTab ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {activeTab === 'slack' ? 'Copy Slack message' : 'Copy email'}
                </>
              )}
            </button>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {activeText}
          </pre>
        </div>
      </section>
    </div>
  )
}
