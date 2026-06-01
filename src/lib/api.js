const API_PATH = '/api/extract-meeting-actions'

/**
 * @param {string} transcript
 * @returns {Promise<{
 *   decisions: { text: string, confidence: string }[],
 *   action_items: { task: string, owner: string | null, deadline: string | null, confidence: string, flag: string | null }[],
 *   open_questions: { text: string }[],
 *   summary: string,
 *   warnings: string[]
 * }>}
 */
export async function extractMeetingActions(transcript) {
  if (!transcript?.trim()) {
    throw new Error('Transcript is empty.')
  }

  let response
  try {
    response = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Request failed: ${message}`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Server returned an invalid JSON response.')
  }

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status}).`)
  }

  return data
}
