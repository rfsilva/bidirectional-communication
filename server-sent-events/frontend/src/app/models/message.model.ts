/**
 * Modelos para o sistema de mensagens de usuários
 * CORRIGIDO: Alinhado com os DTOs do backend
 */

export interface Message {
  id?: number;
  title: string;
  content: string;
  type: MessageType;
  priority: Priority;
  isRead: boolean;
  isExternal: boolean;
  externalSource?: string;
  
  // Dados do usuário (alinhado com UserMessageDTO do backend)
  userId: number;
  username: string;
  userFullName: string;
  
  // Datas
  createdAt: string;
  updatedAt?: string;
  readAt?: string;
}

/**
 * Interface para dados básicos do usuário nas mensagens
 * CORRIGIDO: Removidos campos que não vêm do backend (email, role)
 */
export interface MessageUser {
  id: number;
  username: string;
  fullName: string;
}

export enum MessageType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface MessageCreateRequest {
  userId: number;
  title: string;
  content: string;
  type?: MessageType;
  priority?: Priority;
}

export interface MessageUpdateRequest {
  title?: string;
  content?: string;
  type?: MessageType;
  priority?: Priority;
}

/**
 * CORRIGIDO: Alinhado com UserMessageStatsDTO do backend
 */
export interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  readMessages: number;        // ✅ Adicionado
  infoMessages: number;
  successMessages: number;
  warningMessages: number;
  errorMessages: number;
  externalMessages: number;    // ✅ Adicionado
  internalMessages: number;    // ✅ Adicionado
}

/**
 * CORRIGIDO: Alinhado com AdminMessageStatsDTO do backend
 */
export interface AdminMessageStats {
  totalMessages: number;
  unreadMessages: number;
  externalMessages: number;
  totalUsers: number;          // ✅ Adicionado
  lastMessageAt?: string;
}

export interface MessageFilter {
  type?: MessageType;
  priority?: Priority;
  isRead?: boolean;
  isExternal?: boolean;
  externalSource?: string;
  userId?: number;
}

/**
 * Utilitários para mensagens
 */
export class MessageUtils {
  
  static getTypeColor(type: MessageType): string {
    switch (type) {
      case MessageType.INFO:
        return 'blue';
      case MessageType.SUCCESS:
        return 'green';
      case MessageType.WARNING:
        return 'orange';
      case MessageType.ERROR:
        return 'red';
      default:
        return 'gray';
    }
  }

  static getTypeIcon(type: MessageType): string {
    switch (type) {
      case MessageType.INFO:
        return 'info-circle';
      case MessageType.SUCCESS:
        return 'check-circle';
      case MessageType.WARNING:
        return 'exclamation-triangle';
      case MessageType.ERROR:
        return 'times-circle';
      default:
        return 'envelope';
    }
  }

  static getPriorityColor(priority: Priority): string {
    switch (priority) {
      case Priority.LOW:
        return 'gray';
      case Priority.NORMAL:
        return 'blue';
      case Priority.HIGH:
        return 'orange';
      case Priority.URGENT:
        return 'red';
      default:
        return 'gray';
    }
  }

  static getPriorityIcon(priority: Priority): string {
    switch (priority) {
      case Priority.LOW:
        return 'arrow-down';
      case Priority.NORMAL:
        return 'minus';
      case Priority.HIGH:
        return 'arrow-up';
      case Priority.URGENT:
        return 'exclamation';
      default:
        return 'minus';
    }
  }

  static getTypeDisplayName(type: MessageType): string {
    switch (type) {
      case MessageType.INFO:
        return 'Informação';
      case MessageType.SUCCESS:
        return 'Sucesso';
      case MessageType.WARNING:
        return 'Aviso';
      case MessageType.ERROR:
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  }

  static getPriorityDisplayName(priority: Priority): string {
    switch (priority) {
      case Priority.LOW:
        return 'Baixa';
      case Priority.NORMAL:
        return 'Normal';
      case Priority.HIGH:
        return 'Alta';
      case Priority.URGENT:
        return 'Urgente';
      default:
        return 'Desconhecida';
    }
  }

  static formatExternalSource(source?: string): string {
    if (!source) return 'Sistema Interno';
    
    const sourceMap: { [key: string]: string } = {
      'REPORT_SYSTEM': 'Sistema de Relatórios',
      'NOTIFICATION_CENTER': 'Central de Notificações',
      'BILLING_SYSTEM': 'Sistema de Cobrança',
      'SECURITY_ALERTS': 'Alertas de Segurança',
      'BACKUP_SYSTEM': 'Sistema de Backup',
      'MONITORING_SYSTEM': 'Sistema de Monitoramento'
    };

    return sourceMap[source] || source;
  }

  static isHighPriority(message: Message): boolean {
    return message.priority === Priority.HIGH || message.priority === Priority.URGENT;
  }

  static isUnread(message: Message): boolean {
    return !message.isRead;
  }

  static isExternal(message: Message): boolean {
    return message.isExternal;
  }

  static getMessageAge(message: Message): string {
    const now = new Date();
    const created = new Date(message.createdAt);
    const diffMs = now.getTime() - created.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return created.toLocaleDateString('pt-BR');
    }
  }

  static sortByPriority(messages: Message[]): Message[] {
    const priorityOrder = {
      [Priority.URGENT]: 4,
      [Priority.HIGH]: 3,
      [Priority.NORMAL]: 2,
      [Priority.LOW]: 1
    };

    return messages.sort((a, b) => {
      // Primeiro por prioridade (maior primeiro)
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Depois por data (mais recente primeiro)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  static filterMessages(messages: Message[], filter: MessageFilter): Message[] {
    return messages.filter(message => {
      if (filter.type && message.type !== filter.type) return false;
      if (filter.priority && message.priority !== filter.priority) return false;
      if (filter.isRead !== undefined && message.isRead !== filter.isRead) return false;
      if (filter.isExternal !== undefined && message.isExternal !== filter.isExternal) return false;
      if (filter.externalSource && message.externalSource !== filter.externalSource) return false;
      if (filter.userId && message.userId !== filter.userId) return false;
      
      return true;
    });
  }

  /**
   * NOVO: Converte Message para MessageUser (para compatibilidade)
   */
  static getMessageUser(message: Message): MessageUser {
    return {
      id: message.userId,
      username: message.username,
      fullName: message.userFullName
    };
  }

  /**
   * NOVO: Verifica se o usuário atual pode editar a mensagem
   */
  static canEditMessage(message: Message, currentUserId: number, isAdmin: boolean): boolean {
    return isAdmin || message.userId === currentUserId;
  }

  /**
   * NOVO: Verifica se o usuário atual pode excluir a mensagem
   */
  static canDeleteMessage(message: Message, currentUserId: number, isAdmin: boolean): boolean {
    return MessageUtils.canEditMessage(message, currentUserId, isAdmin);
  }
}