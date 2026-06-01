import { extractMeetingActionsFromGroq } from '../src/lib/groqExtract.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transcript } = req.body ?? {}
    const result = await extractMeetingActionsFromGroq(transcript)
    return res.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('not set') ? 500 : 400
    return res.status(status).json({ error: message })
  }
}
