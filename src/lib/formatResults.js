function formatActionItem(item) {
  const owner = item.owner ?? 'Unassigned'
  const deadline = item.deadline ?? 'No deadline'
  const urgent = item.is_urgent ? ' 🔥 *URGENT*' : ''
  const urgencyNote = item.urgency_reason ? ` _(${item.urgency_reason})_` : ''
  const flag = item.flag ? ` _(${item.flag})_` : ''
  return `• ${item.task} — ${owner}, due ${deadline}${urgent}${urgencyNote}${flag}`
}

export function formatSlackMessage(data) {
  const { decisions, action_items, open_questions, summary, warnings } = data
  const lines = ['*Meeting follow-up*', '', summary || '_No summary provided._', '']

  if (decisions?.length) {
    lines.push('*📋 Decisions*')
    for (const d of decisions) {
      lines.push(`• ${d.text} _(${d.confidence} confidence)_`)
    }
    lines.push('')
  }

  if (action_items?.length) {
    lines.push('*✅ Action Items*')
    for (const item of action_items) {
      lines.push(formatActionItem(item))
    }
    lines.push('')
  }

  if (open_questions?.length) {
    lines.push('*❓ Open Questions*')
    for (const q of open_questions) {
      lines.push(`• ${q.text}`)
    }
    lines.push('')
  }

  if (warnings?.length) {
    lines.push('*⚠️ Warnings*')
    for (const w of warnings) {
      lines.push(`• ${w}`)
    }
  }

  return lines.join('\n').trim()
}

export function formatEmailMessage(data) {
  const { decisions, action_items, open_questions, summary, warnings } = data
  const subject = 'Follow-up: Meeting summary and action items'

  const sections = [
    'Hi team,',
    '',
    'Thank you for the meeting today. Below is a summary of what we discussed and the agreed next steps.',
    '',
    'SUMMARY',
    summary || 'No summary provided.',
    '',
  ]

  if (decisions?.length) {
    sections.push('DECISIONS')
    for (const d of decisions) {
      sections.push(`• ${d.text} (${d.confidence} confidence)`)
    }
    sections.push('')
  }

  if (action_items?.length) {
    sections.push('ACTION ITEMS')
    for (const item of action_items) {
      const owner = item.owner ?? 'Unassigned'
      const deadline = item.deadline ?? 'TBD'
      let line = `• ${item.task} — Owner: ${owner}, Deadline: ${deadline}`
      if (item.is_urgent) {
        line += ` [URGENT${item.urgency_reason ? `: ${item.urgency_reason}` : ''}]`
      }
      if (item.flag) line += ` (Note: ${item.flag})`
      sections.push(line)
    }
    sections.push('')
  }

  if (open_questions?.length) {
    sections.push('OPEN QUESTIONS')
    for (const q of open_questions) {
      sections.push(`• ${q.text}`)
    }
    sections.push('')
  }

  if (warnings?.length) {
    sections.push('ITEMS NEEDING ATTENTION')
    for (const w of warnings) {
      sections.push(`• ${w}`)
    }
    sections.push('')
  }

  sections.push('Best regards,')

  return { subject, body: sections.join('\n').trim() }
}
