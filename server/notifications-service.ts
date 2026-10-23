import { notifyOwner } from './_core/notification';

/**
 * Notifications Service
 * Gerencia notificações em tempo real para eventos VPN
 */

export interface VPNNotification {
  id: string;
  type: 'connection' | 'disconnection' | 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  userId?: string;
  serverId?: string;
  carrier?: string;
  sni?: string;
  latency?: number;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  enableConnectionNotifications: boolean;
  enableDisconnectionNotifications: boolean;
  enableErrorNotifications: boolean;
  enableWarningNotifications: boolean;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm
}

class NotificationsService {
  private notifications: Map<string, VPNNotification[]> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private subscribers: Map<string, Set<(notification: VPNNotification) => void>> = new Map();

  /**
   * Enviar notificação de conexão bem-sucedida
   */
  async notifyConnectionSuccess(
    userId: string,
    serverId: string,
    carrier: string,
    sni: string,
    latency: number
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `conn-${Date.now()}`,
      type: 'success',
      title: 'Conexão Estabelecida',
      message: `Conectado a ${serverId} (${carrier}) com ${latency}ms de latência`,
      timestamp: new Date(),
      userId,
      serverId,
      carrier,
      sni,
      latency,
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de desconexão
   */
  async notifyDisconnection(
    userId: string,
    serverId: string,
    carrier: string,
    reason: string
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `disc-${Date.now()}`,
      type: 'disconnection',
      title: 'Desconectado',
      message: `Desconectado de ${serverId} (${carrier}). Motivo: ${reason}`,
      timestamp: new Date(),
      userId,
      serverId,
      carrier,
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de erro
   */
  async notifyError(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `err-${Date.now()}`,
      type: 'error',
      title,
      message,
      timestamp: new Date(),
      userId,
      data,
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de aviso
   */
  async notifyWarning(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `warn-${Date.now()}`,
      type: 'warning',
      title,
      message,
      timestamp: new Date(),
      userId,
      data,
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de SNI melhor encontrado
   */
  async notifyBestSNIFound(
    userId: string,
    carrier: string,
    oldSNI: string,
    newSNI: string,
    latencyImprovement: number
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `sni-${Date.now()}`,
      type: 'info',
      title: 'Melhor SNI Encontrado',
      message: `Melhor SNI encontrado para ${carrier}: ${newSNI} (${latencyImprovement}ms mais rápido)`,
      timestamp: new Date(),
      userId,
      carrier,
      sni: newSNI,
      data: {
        oldSNI,
        newSNI,
        latencyImprovement,
      },
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de servidor caído
   */
  async notifyServerDown(
    userId: string,
    serverId: string,
    carrier: string
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `down-${Date.now()}`,
      type: 'error',
      title: 'Servidor Indisponível',
      message: `Servidor ${serverId} (${carrier}) está indisponível. Tentando reconectar...`,
      timestamp: new Date(),
      userId,
      serverId,
      carrier,
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de reconexão bem-sucedida
   */
  async notifyReconnectionSuccess(
    userId: string,
    serverId: string,
    carrier: string,
    attempts: number
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `recon-${Date.now()}`,
      type: 'success',
      title: 'Reconectado com Sucesso',
      message: `Reconectado a ${serverId} (${carrier}) após ${attempts} tentativa(s)`,
      timestamp: new Date(),
      userId,
      serverId,
      carrier,
      data: { attempts },
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de latência alta
   */
  async notifyHighLatency(
    userId: string,
    serverId: string,
    latency: number,
    threshold: number
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `lat-${Date.now()}`,
      type: 'warning',
      title: 'Latência Alta Detectada',
      message: `Latência de ${latency}ms (limite: ${threshold}ms) em ${serverId}`,
      timestamp: new Date(),
      userId,
      serverId,
      latency,
      data: { threshold },
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação de dados de teste
   */
  async notifyTestResults(
    userId: string,
    carrier: string,
    successRate: number,
    avgLatency: number
  ): Promise<VPNNotification> {
    const notification: VPNNotification = {
      id: `test-${Date.now()}`,
      type: 'info',
      title: 'Resultados de Teste',
      message: `Testes concluídos para ${carrier}: ${successRate}% sucesso, ${avgLatency}ms latência média`,
      timestamp: new Date(),
      userId,
      carrier,
      data: { successRate, avgLatency },
    };

    await this.sendNotification(notification);
    return notification;
  }

  /**
   * Enviar notificação genérica
   */
  private async sendNotification(notification: VPNNotification): Promise<void> {
    // Armazenar notificação
    const userNotifications = this.notifications.get(notification.userId || 'system') || [];
    userNotifications.push(notification);
    this.notifications.set(notification.userId || 'system', userNotifications);

    // Limpar notificações antigas (mais de 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const filtered = userNotifications.filter((n) => n.timestamp > sevenDaysAgo);
    this.notifications.set(notification.userId || 'system', filtered);

    // Notificar subscribers
    const subscribers = this.subscribers.get(notification.userId || 'system') || new Set();
    subscribers.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error calling subscriber:', error);
      }
    });

    // Enviar notificação ao owner via Manus
    if (notification.type === 'error' || notification.type === 'warning') {
      try {
        await notifyOwner({
          title: notification.title,
          content: notification.message,
        });
      } catch (error) {
        console.error('Error sending owner notification:', error);
      }
    }
  }

  /**
   * Obter preferências de notificação do usuário
   */
  getPreferences(userId: string): NotificationPreferences {
    return (
      this.preferences.get(userId) || {
        userId,
        enableConnectionNotifications: true,
        enableDisconnectionNotifications: true,
        enableErrorNotifications: true,
        enableWarningNotifications: true,
        enablePushNotifications: true,
        enableEmailNotifications: false,
      }
    );
  }

  /**
   * Atualizar preferências de notificação
   */
  setPreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.getPreferences(userId);
    this.preferences.set(userId, { ...current, ...preferences });
  }

  /**
   * Obter notificações do usuário
   */
  getNotifications(userId: string, limit: number = 50): VPNNotification[] {
    const notifications = this.notifications.get(userId) || [];
    return notifications.slice(-limit).reverse();
  }

  /**
   * Obter notificações por tipo
   */
  getNotificationsByType(
    userId: string,
    type: VPNNotification['type'],
    limit: number = 50
  ): VPNNotification[] {
    const notifications = this.notifications.get(userId) || [];
    return notifications
      .filter((n) => n.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Limpar notificações do usuário
   */
  clearNotifications(userId: string): void {
    this.notifications.delete(userId);
  }

  /**
   * Limpar notificação específica
   */
  clearNotification(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId) || [];
    const filtered = notifications.filter((n) => n.id !== notificationId);
    this.notifications.set(userId, filtered);
  }

  /**
   * Subscribe a notificações em tempo real
   */
  subscribe(
    userId: string,
    callback: (notification: VPNNotification) => void
  ): () => void {
    const subscribers = this.subscribers.get(userId) || new Set();
    subscribers.add(callback);
    this.subscribers.set(userId, subscribers);

    // Retornar função para unsubscribe
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(userId);
      }
    };
  }

  /**
   * Obter estatísticas de notificações
   */
  getStats(userId: string) {
    const notifications = this.notifications.get(userId) || [];
    const types = notifications.reduce(
      (acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: notifications.length,
      byType: types,
      lastNotification: notifications[notifications.length - 1],
    };
  }
}

// Singleton instance
let notificationsService: NotificationsService | null = null;

export function getNotificationsService(): NotificationsService {
  if (!notificationsService) {
    notificationsService = new NotificationsService();
  }
  return notificationsService;
}

export default NotificationsService;
