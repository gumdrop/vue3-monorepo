import type { Application, Request, Response } from 'express'
import { notificationService, type NotificationPayload } from './NotificationService'

const root = '/rest/notifications'

export default function configure(app: Application) {
  app
    .get(`${root}/stream`, handleNotificationStream)
    .post(`${root}/send`, postSendNotification)
}

function handleNotificationStream(req: Request, res: Response) {
  const siteUserId = req.query['siteUserId'] as string | undefined
  const uid = req.query['uid'] as string | undefined

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  // Prevent connection timeout by writing an initial comment
  res.write(':ok\n\n')

  const clientId = notificationService.addClient(res, siteUserId, uid)

  // Keep-alive heartbeat to prevent intermediate proxy/load-balancer timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(':ping\n\n')
    } catch (err) {
      // Handled by close/error events
    }
  }, 30000)

  const cleanup = () => {
    clearInterval(heartbeat)
    notificationService.removeClient(clientId)
    try {
      res.end()
    } catch (err) {
      // Already closed
    }
  }

  req.on('close', cleanup)
  req.on('end', cleanup)
  res.on('error', cleanup)
}

function postSendNotification(req: Request, res: Response) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const target = body.target as { siteUserIds?: string[]; uids?: string[] } | undefined
    const payload = body.payload as NotificationPayload | undefined

    if (!payload || !payload.title || !payload.body) {
      res.status(400).json({ error: 'Payload with title and body is required' })
      return
    }

    if (!target || (!target.siteUserIds && !target.uids)) {
      res.status(400).json({ error: 'A target with siteUserIds or uids is required' })
      return
    }

    const siteUserIds = target.siteUserIds || []
    const uids = target.uids || []

    if (siteUserIds.length === 0 && uids.length === 0) {
      res.status(400).json({ error: 'At least one target siteUserId or uid must be specified' })
      return
    }

    notificationService.sendToUsers(payload, { siteUserIds, uids })
    res.json({
      success: true,
      message: `Notification sent to targeted clients (siteUserIds: ${siteUserIds.length}, uids: ${uids.length})`,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send notification' })
  }
}
