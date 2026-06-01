import {
  enrichActionItemsWithUrgency,
  sortActionItemsByUrgency,
} from './urgency.js'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const JSON_RETRY_INSTRUCTION =
  'Your previous response was not valid JSON. Return ONLY the JSON object, no markdown, no explanation.'

const SYSTEM_PROMPT = `You are a meeting analyst. Extract structured data from meeting transcripts.

Language:
- Accept transcripts in any language, including Urdu (اردو), English, or mixed language.
- Understand the meeting content in the source language.
- Write all JSON string values (summary, tasks, decisions, flags, warnings, open_questions) in English so follow-ups are easy to share internationally.

Return ONLY valid JSON with this exact structure:
{
  "decisions": [{ "text": "string", "confidence": "high|medium|low" }],
  "action_items": [{
    "task": "string",
    "owner": "string or null",
    "deadline": "string or null",
    "confidence": "high|medium|low",
    "is_urgent": false,
    "urgency_reason": "string or null",
    "flag": "string or null"
  }],
  "open_questions": [{ "text": "string" }],
  "summary": "2-3 sentence meeting summary",
  "warnings": ["string"]
}

Rules:
- If owner is unclear, set owner to null and add a flag explaining why
- Resolve vague deadlines like 'next Friday' to actual dates using today's date (prefer YYYY-MM-DD)
- If a deadline is vague, still resolve it but add a flag
- If no decisions or actions found, return empty arrays with a warning
- warnings array captures anything ambiguous or missing

Confidence (how explicitly stated in the transcript — NOT urgency):
- high: clear owner and firm commitment or decision in the transcript
- medium: task is clear but owner or date is soft or implied
- low: hedged, vague, or single weak mention ("might", "someone should")

Urgency (set is_urgent true only when at least one applies):
- deadline is within 7 days of today's date (including today or overdue)
- OR the transcript treats this as the top/blocking/critical item (e.g. launch blocker, "must", "before launch", "most important", repeated emphasis, recap listed first)
- otherwise is_urgent must be false
- when is_urgent is true, set urgency_reason to one short sentence explaining why (deadline proximity and/or meeting priority)`

function parseJsonFromContent(content) {
  const trimmed = content.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  const jsonText = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(jsonText)
}

function buildMessages(transcript, { previousResponse } = {}) {
  const today = new Date().toISOString().slice(0, 10)
  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nToday's date: ${today}` },
    { role: 'user', content: transcript },
  ]

  if (previousResponse) {
    messages.push(
      { role: 'assistant', content: previousResponse },
      { role: 'user', content: JSON_RETRY_INSTRUCTION },
    )
  }

  return messages
}

async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Add it to your .env file.',
    )
  }

  let response
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.2,
      }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Groq API request failed: ${message}`)
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      const errorBody = await response.json()
      detail = errorBody.error?.message ?? JSON.stringify(errorBody)
    } catch {
      // response body was not JSON
    }
    throw new Error(`Groq API error (${response.status}): ${detail}`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Groq API returned an invalid JSON response.')
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq API returned no message content.')
  }

  return content
}

function finalizeResult(parsed) {
  const referenceDate = new Date()
  const action_items = sortActionItemsByUrgency(
    enrichActionItemsWithUrgency(parsed.action_items ?? [], referenceDate),
  )
  return { ...parsed, action_items }
}

export async function extractMeetingActionsFromGroq(transcript) {
  if (!transcript?.trim()) {
    throw new Error('Transcript is empty.')
  }

  const messages = buildMessages(transcript)
  const content = await callGroq(messages)

  try {
    return finalizeResult(parseJsonFromContent(content))
  } catch {
    const retryMessages = buildMessages(transcript, {
      previousResponse: content,
    })
    const retryContent = await callGroq(retryMessages)
    try {
      return finalizeResult(parseJsonFromContent(retryContent))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(
        `Failed to parse meeting actions from API response: ${message}`,
      )
    }
  }
}
