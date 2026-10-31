import { prisma } from '../db/prisma.js'
import { pushService } from '../external/push.service.js'

/** Envía push FCM a todos los dispositivos de usuarios Administrador. */
export async function notifyAdmins(opts: {
  title: string
  body: string
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

    await Promise.allSettled(
      devices.map((d) =>
        pushService.notify({
          token: d.fcmToken,
          title: opts.title,
          body: opts.body,
        }),
      ),
    )
  } catch (err) {
    console.error('[pushNotify] fallo al notificar admins', err)
  }
}
