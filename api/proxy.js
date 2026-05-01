export default async function handler(req, res) {
  const target = 'https://app-128839102.1cmycloud.com/applications/mafia/api/change/newgame'

  const response = await fetch(target, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
  })

  const data = await response.json()
  res.status(response.status).json(data)
}
