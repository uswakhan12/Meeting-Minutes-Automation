const API_PATH = '/api/extract-meeting-actions'

export class NetworkError extends Error {
  constructor(
    message = 'Unable to reach the server. Check your connection and try again.',
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ApiError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ApiError'
  }
}

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
    throw new ApiError('Transcript is empty.')
  }

  let response
  try {
    response = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })
  } catch {
    throw new NetworkError()
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new ApiError('Server returned an invalid JSON response.')
  }

  if (!response.ok) {
    throw new ApiError(data.error ?? `Request failed (${response.status}).`)
  }

  return data
}
