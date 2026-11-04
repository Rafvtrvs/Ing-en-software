import { prisma } from '../db/prisma.js'
import { pushService } from '../external/push.service.js'

/** Envía push FCM a todos los dispositivos de usuarios Administrador. */
export async function notifyAdmins(opts: {
  title: string
  body: string
  link?: string
  orderId?: string
  notifType?: 'order' | 'system' | 'inventory'
  excludeUserId?: number
}): Promise<void> {
  try {
    const admins = await prisma.usuario.findMany({
      where: {
        estado: 'Activo',
        rol: { nombre: { contains: 'Administrador', mode: 'insensitive' } },
        ...(opts.excludeUserId != null ? { id: { not: opts.excludeUserId } } : {}),
      },
      select: { id: true },
    })
    if (admins.length === 0) return
    const ids = admins.map((a) => a.id)
    const devices = await prisma.dispositivoPush.findMany({
      where: { idUsuario: { in: ids } },
    })
    if (devices.length === 0) return

    const uniqueTokens = [...new Set(devices.map((d) => d.fcmToken))]

    await Promise.allSettled(
      uniqueTokens.map((token) =>
        pushService.notify({
          token,
          title: opts.title,
          body: opts.body,
          link: opts.link ?? '/',
          orderId: opts.orderId,
          notifType: opts.notifType ?? 'system',
        }),
      ),
    )
  } catch (err) {
    console.error('[pushNotify] fallo al notificar admins', err)
  }
}
