import { extractMeetingActions } from './extractMeetingActions.js'

const API_PATH = '/api/extract-meeting-actions'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON body.'))
      }
    })
    req.on('error', reject)
  })
}

function groqApiMiddleware(req, res, next) {
  if (req.url !== API_PATH || req.method !== 'POST') {
    next()
    return
  }

  void (async () => {
    try {
      const { transcript } = await readJsonBody(req)
      const result = await extractMeetingActions(transcript)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const status = message.includes('not set') ? 500 : 400
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: message }))
    }
  })()
}

export function groqApiPlugin() {
  return {
    name: 'groq-api',
    configureServer(server) {
      server.middlewares.use(groqApiMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(groqApiMiddleware)
    },
  }
}
