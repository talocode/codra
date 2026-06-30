import { findRoute, handleNotFound } from './router'

const PORT = parseInt(process.env.PORT ?? '3001', 10)

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const route = findRoute(request.method, url.pathname)

  if (!route) {
    return handleNotFound()
  }

  try {
    return await route.handler(request)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json(
      { ok: false, error: { code: 'internal_error', message } },
      { status: 500 },
    )
  }
}

const server = typeof Bun !== 'undefined' ? Bun?.serve : undefined

if (server) {
  Bun.serve({
    port: PORT,
    fetch: handleRequest,
  })
} else {
  const http = await import('node:http')
  const server_ = http.createServer(async (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] ?? 'http'
    const host = req.headers.host ?? 'localhost'
    const url = new URL(req.url ?? '/', `${protocol}://${host}`)

    const body: Buffer[] = []
    req.on('data', (chunk: Buffer) => body.push(chunk))
    req.on('end', async () => {
      const rawBody = Buffer.concat(body).toString()
      const request = new Request(url.toString(), {
        method: req.method,
        headers: Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v ?? '']) as [string, string][],
        body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : rawBody,
      })

      const response = await handleRequest(request)
      const responseBody = await response.text()

      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(responseBody)
    })
  })

  server_.listen(PORT, () => {
    console.log(`Codra Cloud API v0.1 listening on http://localhost:${PORT}`)
    console.log(`Routes: /v1/codra/repo-summary, /v1/codra/explain, /v1/codra/review, /v1/codra/plan`)
    console.log(`Local routes: /api/v1/codra/repo-summary, /api/v1/codra/explain, /api/v1/codra/review, /api/v1/codra/plan`)
  })
}
