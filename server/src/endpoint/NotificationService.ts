import type { Response } from 'express'
import { v4 as uuid } from 'uuid'

export interface NotificationPayload {
  title: string
  body: string
  link?: string
  type?: string
  timestamp?: string
}

export interface ActiveClient {
  id: string
  res: Response
  siteUserId?: string
  uid?: string
}

class NotificationService {
  private clients: Map<string, ActiveClient> = new Map()

  /**
   * Register a new active client connection.
   */
  public addClient(res: Response, siteUserId?: string, uid?: string): string {
    const id = uuid()
    const client: ActiveClient = { id, res, siteUserId, uid }
    this.clients.set(id, client)
    return id
  }

  /**
   * Remove an active client connection.
   */
  public removeClient(id: string) {
    this.clients.delete(id)
  }



  /**
   * Send a notification to specific siteusers (by their siteUserId or firebase auth uid).
   */
  public sendToUsers(
    payload: NotificationPayload,
    targets: { siteUserIds?: string[]; uids?: string[] }
  ) {
    const data = JSON.stringify({
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    })

    const targetSiteUserIds = new Set(targets.siteUserIds || [])
    const targetUids = new Set(targets.uids || [])

    for (const client of this.clients.values()) {
      const matchSiteUser = client.siteUserId && targetSiteUserIds.has(client.siteUserId)
      const matchUid = client.uid && targetUids.has(client.uid)

      if (matchSiteUser || matchUid) {
        try {
          client.res.write(`data: ${data}\n\n`)
        } catch (err) {
          console.error(`Failed to send targeted notification to client ${client.id}:`, err)
        }
      }
    }
  }

  /**
   * Get count of active clients for monitoring.
   */
  public getActiveClientCount(): number {
    return this.clients.size
  }
}

export const notificationService = new NotificationService()
