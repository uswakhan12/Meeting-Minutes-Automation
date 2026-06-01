const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama3-70b-8192'

const SYSTEM_PROMPT = `You are a meeting analyst. Extract structured data from meeting transcripts.

Return ONLY valid JSON with this exact structure:
{
  "decisions": [{ "text": "string", "confidence": "high|medium|low" }],
  "action_items": [{
    "task": "string",
    "owner": "string or null",
    "deadline": "string or null",
    "confidence": "high|medium|low",
    "flag": "string or null"
  }],
  "open_questions": [{ "text": "string" }],
  "summary": "2-3 sentence meeting summary",
  "warnings": ["string"]
}

Rules:
- If owner is unclear, set owner to null and add a flag explaining why
- Resolve vague deadlines like 'next Friday' to actual dates using today's date
- If a deadline is vague, still resolve it but add a flag
- If no decisions or actions found, return empty arrays with a warning
- warnings array captures anything ambiguous or missing`

function parseJsonFromContent(content) {
  const trimmed = content.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  const jsonText = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(jsonText)
}

export async function extractMeetingActions(transcript) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Add it to your .env file.',
    )
  }

  if (!transcript?.trim()) {
    throw new Error('Transcript is empty.')
  }

  const today = new Date().toISOString().slice(0, 10)
  const systemContent = `${SYSTEM_PROMPT}\n\nToday's date: ${today}`

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
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: transcript },
        ],
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

  try {
    return parseJsonFromContent(content)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to parse meeting actions from API response: ${message}`,
    )
  }
}
