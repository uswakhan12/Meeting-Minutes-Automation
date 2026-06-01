/** @param {Date} referenceDate */
function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * @param {string | null | undefined} deadlineStr
 * @returns {Date | null}
 */
export function parseDeadlineDate(deadlineStr) {
  if (!deadlineStr?.trim()) return null

  const trimmed = deadlineStr.trim()
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    if (!Number.isNaN(d.getTime())) return d
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) return parsed

  return null
}

/**
 * @param {Date} deadline
 * @param {Date} referenceDate
 */
export function daysUntilDeadline(deadline, referenceDate) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round(
    (startOfDay(deadline).getTime() - startOfDay(referenceDate).getTime()) /
      msPerDay,
  )
}

export const NEAR_DEADLINE_DAYS = 7

/**
 * Merge LLM urgency flags with deadline proximity rules.
 * @param {Array<Record<string, unknown>>} actionItems
 * @param {Date} [referenceDate]
 */
export function enrichActionItemsWithUrgency(actionItems, referenceDate = new Date()) {
  return (actionItems ?? []).map((item) => {
    const urgentFromModel = item.is_urgent === true
    let urgentFromDeadline = false
    let deadlineReason = null

    const deadlineDate = parseDeadlineDate(
      typeof item.deadline === 'string' ? item.deadline : null,
    )

    if (deadlineDate) {
      const days = daysUntilDeadline(deadlineDate, referenceDate)
      if (days < 0) {
        urgentFromDeadline = true
        deadlineReason = `Deadline is ${Math.abs(days)} day(s) ago (${item.deadline})`
      } else if (days <= NEAR_DEADLINE_DAYS) {
        urgentFromDeadline = true
        deadlineReason =
          days === 0
            ? `Due today (${item.deadline})`
            : `Due in ${days} day(s) (${item.deadline})`
      }
    }

    const isUrgent = urgentFromModel || urgentFromDeadline
    const modelReason =
      typeof item.urgency_reason === 'string' ? item.urgency_reason.trim() : ''

    return {
      ...item,
      is_urgent: isUrgent,
      urgency_reason: isUrgent
        ? modelReason || deadlineReason || 'Marked as urgent'
        : null,
    }
  })
}

/**
 * @param {Array<{ is_urgent?: boolean }>} actionItems
 */
export function sortActionItemsByUrgency(actionItems) {
  return [...(actionItems ?? [])].sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1
    if (!a.is_urgent && b.is_urgent) return 1
    return 0
  })
}
