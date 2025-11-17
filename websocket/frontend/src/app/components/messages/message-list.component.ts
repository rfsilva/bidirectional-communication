import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service'; // Mudança: WebSocket ao invés de SSE
import { 
  Message, 
  MessageType, 
  Priority, 
  MessageUtils, 
  MessageFilter,
  MessageStats 
} from '../../models/message.model';
import { UserRole } from '../../models/auth.model';
import { NotificationMessage } from '../../models/data-entity.model';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.css']
})
export class MessageListComponent implements OnInit, OnDestroy {
  
  // Dados
  messages: Message[] = [];
  filteredMessages: Message[] = [];
  stats: MessageStats | null = null;
  
  // Estado da UI
  loading = false;
  error: string | null = null;
  selectedMessage: Message | null = null;
  
  // 🆕 Notificações WebSocket
  messageNotifications: NotificationMessage[] = [];
  unreadNotificationCount = 0;
  isWebSocketConnected = false; // Mudança: WebSocket ao invés de SSE
  
  // Filtros
  currentFilter: MessageFilter = {};
  searchTerm = '';
  showUnreadOnly = false;
  showExternalOnly = false;
  selectedType: MessageType | '' = '';
  selectedPriority: Priority | '' = '';
  selectedSource = '';
  
  // Paginação
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Ordenação
  sortBy: 'date' | 'priority' | 'type' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Enums para template
  messageTypes = Object.values(MessageType);
  priorities = Object.values(Priority);
  MessageType = MessageType;
  Priority = Priority;
  MessageUtils = MessageUtils;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
    private webSocketService: WebSocketService // Mudança: WebSocket ao invés de SSE
  ) {}

  ngOnInit(): void {
    this.loadMessages();
    this.loadStats();
    this.setupSubscriptions();
    this.initializeWebSocket(); // Mudança: WebSocket ao invés de SSE
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // 🆕 Inicializar conexão WebSocket
  private initializeWebSocket(): void {
    // Verificar se já está conectado
    if (!this.webSocketService.isConnected()) {
      this.webSocketService.connect();
    }
  }

  private setupSubscriptions(): void {
    // Escutar atualizações de mensagens
    const messagesUpdatedSub = this.messageService.messagesUpdated$.subscribe(() => {
      this.loadMessages();
      this.loadStats();
    });
    this.subscriptions.push(messagesUpdatedSub);

    // 🆕 Escutar status da conexão WebSocket
    const webSocketStatusSub = this.webSocketService.connectionStatus$.subscribe(status => {
      this.isWebSocketConnected = status;
    });
    this.subscriptions.push(webSocketStatusSub);

    // 🆕 Escutar notificações específicas de mensagens
    const messageNotificationsSub = this.webSocketService.messageNotifications$.subscribe(notification => {
      if (notification) {
        this.handleMessageNotification(notification);
      }
    });
    this.subscriptions.push(messageNotificationsSub);
  }

  // 🆕 Manipular notificações de mensagens recebidas via WebSocket
  private handleMessageNotification(notification: NotificationMessage): void {
    console.log('📨 MessageList: Nova notificação de mensagem recebida:', notification);
    
    // Adicionar à lista de notificações
    this.messageNotifications.unshift(notification);
    
    // Manter apenas as últimas 5 notificações na tela de mensagens
    if (this.messageNotifications.length > 5) {
      this.messageNotifications = this.messageNotifications.slice(0, 5);
    }
    
    // Incrementar contador
    this.unreadNotificationCount++;
    
    // Recarregar mensagens para mostrar a nova mensagem na lista
    setTimeout(() => {
      this.loadMessages();
    }, 1000);
    
    // Mostrar notificação visual
    this.showNotificationToast(notification);
  }

  // 🆕 Mostrar toast de notificação
  private showNotificationToast(notification: NotificationMessage): void {
    const messageData = notification.data;
    if (messageData && messageData.title) {
      console.log(`🔔 Nova mensagem na tela: ${messageData.title}`);
      
      // Aqui você pode implementar um toast mais sofisticado
      // Por enquanto, apenas destacar visualmente
      this.highlightNewMessage(messageData.messageId);
    }
  }

  // 🆕 Destacar nova mensagem na lista
  private highlightNewMessage(messageId: number): void {
    // Aguardar a lista ser recarregada e então destacar a mensagem
    setTimeout(() => {
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.classList.add('new-message-highlight');
        
        // Remover destaque após 3 segundos
        setTimeout(() => {
          messageElement.classList.remove('new-message-highlight');
        }, 3000);
      }
    }, 1500);
  }

  // 🆕 Marcar notificações como lidas
  markNotificationsAsRead(): void {
    this.unreadNotificationCount = 0;
    console.log('✅ Notificações de mensagens marcadas como lidas na tela de mensagens');
  }

  // 🆕 Limpar notificações
  clearNotifications(): void {
    this.messageNotifications = [];
    this.unreadNotificationCount = 0;
    console.log('🗑️ Notificações de mensagens limpas na tela de mensagens');
  }

  // 🆕 Obter ícone para notificação
  getNotificationIcon(notification: NotificationMessage): string {
    const messageData = notification.data;
    if (messageData && messageData.type) {
      switch (messageData.type) {
        case 'SUCCESS':
          return '✅';
        case 'ERROR':
          return '❌';
        case 'WARNING':
          return '⚠️';
        case 'INFO':
        default:
          return '📨';
      }
    }
    return '📨';
  }

  // 🆕 Obter classe CSS para notificação
  getNotificationClass(notification: NotificationMessage): string {
    const messageData = notification.data;
    if (messageData && messageData.type) {
      switch (messageData.type) {
        case 'SUCCESS':
          return 'alert-success';
        case 'ERROR':
          return 'alert-danger';
        case 'WARNING':
          return 'alert-warning';
        case 'INFO':
        default:
          return 'alert-info';
      }
    }
    return 'alert-info';
  }

  // 🆕 Formatar tempo da notificação
  formatNotificationTime(notification: NotificationMessage): string {
    const messageData = notification.data;
    if (messageData && messageData.timestamp) {
      return new Date(messageData.timestamp).toLocaleTimeString('pt-BR');
    }
    return new Date(notification.timestamp).toLocaleTimeString('pt-BR');
  }

  // CORRIGIDO: Propriedade para compatibilidade com template
  get isSSEConnected(): boolean {
    return this.isWebSocketConnected;
  }

  /**
   * Carrega mensagens do servidor.
   */
  loadMessages(): void {
    this.loading = true;
    this.error = null;
    
    this.messageService.getAllMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar mensagens:', error);
        this.error = 'Erro ao carregar mensagens. Tente novamente.';
        this.loading = false;
      }
    });
  }

  /**
   * Carrega estatísticas das mensagens.
   */
  loadStats(): void {
    this.messageService.getMessageStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
      }
    });
  }

  /**
   * Aplica filtros às mensagens.
   */
  applyFilters(): void {
    let filtered = [...this.messages];
    
    // Filtro de busca por texto
    if (this.searchTerm.trim()) {
      filtered = this.messageService.searchMessages(filtered, this.searchTerm);
    }
    
    // Filtro de não lidas
    if (this.showUnreadOnly) {
      filtered = this.messageService.filterUnreadMessages(filtered);
    }
    
    // Filtro de externas
    if (this.showExternalOnly) {
      filtered = this.messageService.filterExternalMessages(filtered);
    }
    
    // Filtro por tipo
    if (this.selectedType) {
      filtered = this.messageService.filterMessagesByType(filtered, this.selectedType);
    }
    
    // Filtro por prioridade
    if (this.selectedPriority) {
      filtered = this.messageService.filterMessagesByPriority(filtered, this.selectedPriority);
    }
    
    // Filtro por fonte externa
    if (this.selectedSource) {
      filtered = filtered.filter(m => m.externalSource === this.selectedSource);
    }
    
    // Ordenação
    this.applySorting(filtered);
    
    this.filteredMessages = filtered;
    this.updatePagination();
  }

  /**
   * Aplica ordenação às mensagens.
   */
  applySorting(messages: Message[]): void {
    switch (this.sortBy) {
      case 'date':
        messages.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
        
      case 'priority':
        const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
        messages.sort((a, b) => {
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          const diff = this.sortOrder === 'desc' ? priorityB - priorityA : priorityA - priorityB;
          
          // Se prioridades iguais, ordenar por data
          if (diff === 0) {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          }
          
          return diff;
        });
        break;
        
      case 'type':
        messages.sort((a, b) => {
          const comparison = a.type.localeCompare(b.type);
          return this.sortOrder === 'desc' ? -comparison : comparison;
        });
        break;
    }
  }

  /**
   * Atualiza informações de paginação.
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredMessages.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  /**
   * Obtém mensagens da página atual.
   */
  getCurrentPageMessages(): Message[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMessages.slice(startIndex, endIndex);
  }

  /**
   * Muda para uma página específica.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Limpa todos os filtros.
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.showUnreadOnly = false;
    this.showExternalOnly = false;
    this.selectedType = '';
    this.selectedPriority = '';
    this.selectedSource = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Marca mensagem como lida/não lida.
   */
  toggleMessageRead(message: Message): void {
    if (message.isRead) {
      this.messageService.markAsUnread(message.id!).subscribe({
        next: (updatedMessage) => {
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messages[index] = updatedMessage;
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Erro ao marcar mensagem como não lida:', error);
        }
      });
    } else {
      this.messageService.markAsRead(message.id!).subscribe({
        next: (updatedMessage) => {
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messages[index] = updatedMessage;
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Erro ao marcar mensagem como lida:', error);
        }
      });
    }
  }

  /**
   * Marca todas as mensagens como lidas.
   */
  markAllAsRead(): void {
    this.messageService.markAllAsRead().subscribe({
      next: (result) => {
        console.log(`${result.markedCount} mensagens marcadas como lidas`);
        this.loadMessages();
      },
      error: (error) => {
        console.error('Erro ao marcar todas as mensagens como lidas:', error);
      }
    });
  }

  /**
   * Exclui uma mensagem.
   */
  deleteMessage(message: Message): void {
    if (confirm(`Tem certeza que deseja excluir a mensagem "${message.title}"?`)) {
      this.messageService.deleteMessage(message.id!).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m.id !== message.id);
          this.applyFilters();
          // Fechar modal se a mensagem excluída estava selecionada
          if (this.selectedMessage?.id === message.id) {
            this.selectedMessage = null;
          }
        },
        error: (error) => {
          console.error('Erro ao excluir mensagem:', error);
        }
      });
    }
  }

  /**
   * Seleciona uma mensagem para visualização detalhada.
   */
  selectMessage(message: Message): void {
    this.selectedMessage = message;
    
    // Marcar como lida se não estiver
    if (!message.isRead) {
      this.toggleMessageRead(message);
    }
  }

  /**
   * Fecha a visualização detalhada.
   */
  closeMessageDetail(): void {
    this.selectedMessage = null;
  }

  /**
   * Força busca de mensagens externas (apenas ADMIN).
   */
  forceExternalFetch(): void {
    if (!this.canManageMessages()) {
      return;
    }
    
    this.messageService.forceExternalMessageFetch().subscribe({
      next: (result) => {
        console.log(`Busca externa executada: ${result.messagesImported} mensagens importadas`);
        this.loadMessages();
      },
      error: (error) => {
        console.error('Erro na busca externa:', error);
      }
    });
  }

  /**
   * Navega para criação de nova mensagem.
   */
  createNewMessage(): void {
    this.router.navigate(['/messages/new']);
  }

  /**
   * Navega para edição de mensagem.
   */
  editMessage(message: Message): void {
    this.router.navigate(['/messages/edit', message.id]);
  }

  /**
   * Obtém fontes externas únicas para filtro.
   */
  getExternalSources(): string[] {
    const sources = new Set<string>();
    this.messages.forEach(message => {
      if (message.externalSource) {
        sources.add(message.externalSource);
      }
    });
    return Array.from(sources).sort();
  }

  /**
   * Verifica se usuário pode gerenciar mensagens.
   */
  canManageMessages(): boolean {
    return this.authService.hasRole(UserRole.ADMIN);
  }

  /**
   * CORRIGIDO: Verifica se usuário pode editar mensagem usando a nova estrutura.
   */
  canEditMessage(message: Message): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    return MessageUtils.canEditMessage(
      message, 
      currentUser.id, 
      this.authService.hasRole(UserRole.ADMIN)
    );
  }

  /**
   * CORRIGIDO: Verifica se usuário pode excluir mensagem usando a nova estrutura.
   */
  canDeleteMessage(message: Message): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    return MessageUtils.canDeleteMessage(
      message, 
      currentUser.id, 
      this.authService.hasRole(UserRole.ADMIN)
    );
  }

  /**
   * Formata data para exibição.
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  /**
   * NOVO: Obtém nome do usuário da mensagem.
   */
  getMessageUserName(message: Message): string {
    return message.userFullName || message.username;
  }

  /**
   * NOVO: Obtém iniciais do usuário da mensagem.
   */
  getMessageUserInitials(message: Message): string {
    const fullName = message.userFullName;
    if (fullName) {
      const names = fullName.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return message.username[0].toUpperCase();
  }

  /**
   * Obtém classe CSS para o tipo de mensagem.
   */
  getMessageTypeClass(type: MessageType): string {
    return `message-type-${type.toLowerCase()}`;
  }

  /**
   * Obtém classe CSS para a prioridade da mensagem.
   */
  getMessagePriorityClass(priority: Priority): string {
    return `message-priority-${priority.toLowerCase()}`;
  }

  /**
   * NOVO: Obtém cor do tipo de mensagem.
   */
  getTypeColor(type: MessageType): string {
    return MessageUtils.getTypeColor(type);
  }

  /**
   * NOVO: Obtém cor da prioridade.
   */
  getPriorityColor(priority: Priority): string {
    return MessageUtils.getPriorityColor(priority);
  }

  /**
   * NOVO: Obtém ícone do tipo de mensagem.
   */
  getTypeIcon(type: MessageType): string {
    return MessageUtils.getTypeIcon(type);
  }

  /**
   * NOVO: Obtém ícone da prioridade.
   */
  getPriorityIcon(priority: Priority): string {
    return MessageUtils.getPriorityIcon(priority);
  }

  /**
   * NOVO: Formata fonte externa.
   */
  formatExternalSource(source?: string): string {
    return MessageUtils.formatExternalSource(source);
  }

  /**
   * NOVO: Obtém idade da mensagem.
   */
  getMessageAge(message: Message): string {
    return MessageUtils.getMessageAge(message);
  }
}