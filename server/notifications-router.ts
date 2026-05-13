import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { getNotificationsService } from './notifications-service';

const notificationsService = getNotificationsService();

export const notificationsRouter = router({
  /**
   * Obter todas as notificações do usuário
   */
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(({ ctx, input }) => {
      return notificationsService.getNotifications(ctx.user.id.toString(), input?.limit);
    }),

  /**
   * Obter notificações por tipo
   */
  getNotificationsByType: protectedProcedure
    .input(
      z.object({
        type: z.enum(['connection', 'disconnection', 'error', 'warning', 'info', 'success']),
        limit: z.number().default(50),
      })
    )
    .query(({ ctx, input }) => {
      return notificationsService.getNotificationsByType(
        ctx.user.id.toString(),
        input.type,
        input.limit
      );
    }),

  /**
   * Limpar todas as notificações
   */
  clearAll: protectedProcedure.mutation(({ ctx }) => {
    notificationsService.clearNotifications(ctx.user.id.toString());
    return { success: true };
  }),

  /**
   * Limpar notificação específica
   */
  clear: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(({ ctx, input }) => {
      notificationsService.clearNotification(ctx.user.id.toString(), input.notificationId);
      return { success: true };
    }),

  /**
   * Obter preferências de notificação
   */
  getPreferences: protectedProcedure.query(({ ctx }) => {
    return notificationsService.getPreferences(ctx.user.id.toString());
  }),

  /**
   * Atualizar preferências de notificação
   */
  setPreferences: protectedProcedure
    .input(
      z.object({
        enableConnectionNotifications: z.boolean().optional(),
        enableDisconnectionNotifications: z.boolean().optional(),
        enableErrorNotifications: z.boolean().optional(),
        enableWarningNotifications: z.boolean().optional(),
        enablePushNotifications: z.boolean().optional(),
        enableEmailNotifications: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      notificationsService.setPreferences(ctx.user.id.toString(), input);
      return { success: true };
    }),

  /**
   * Obter estatísticas de notificações
   */
  getStats: protectedProcedure.query(({ ctx }) => {
    return notificationsService.getStats(ctx.user.id.toString());
  }),

  /**
   * Testar notificação
   */
  sendTestNotification: protectedProcedure
    .input(z.object({ title: z.string(), message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await notificationsService.notifyWarning(
        ctx.user.id.toString(),
        input.title,
        input.message
      );
      return notification;
    }),
});
