import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Message, 
  MessageCreateRequest, 
  MessageUpdateRequest, 
  MessageStats, 
  AdminMessageStats,
  MessageFilter 
} from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly baseUrl = 'http://localhost:8080/api/messages';
  
  // Subject para notificar mudanças nas mensagens
  private messagesUpdatedSubject = new BehaviorSubject<void>(undefined);
  public messagesUpdated$ = this.messagesUpdatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as mensagens do usuário atual.
   * ADMIN vê todas as mensagens, outros usuários veem apenas as próprias.
   */
  getAllMessages(): Observable<Message[]> {
    return this.http.get<Message[]>(this.baseUrl);
  }

  /**
   * Busca mensagem por ID.
   */
  getMessageById(id: number): Observable<Message> {
    return this.http.get<Message>(`${this.baseUrl}/${id}`);
  }

  /**
   * Lista mensagens de um usuário específico.
   * Apenas ADMIN pode acessar mensagens de outros usuários.
   */
  getMessagesByUserId(userId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/user/${userId}`);
  }

  /**
   * Lista apenas mensagens não lidas do usuário atual.
   */
  getUnreadMessages(): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/unread`);
  }

  /**
   * Cria uma nova mensagem.
   */
  createMessage(request: MessageCreateRequest): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, request).pipe(
      tap(() => this.notifyMessagesUpdated())
    );
  }

  /**
   * Atualiza uma mensagem existente.
   */
  updateMessage(id: number, request: MessageUpdateRequest): Observable<Message> {
    return this.http.put<Message>(`${this.baseUrl}/${id}`, request).pipe(
      tap(() => this.notifyMessagesUpdated())
    );
  }

  /**
   * Exclui uma mensagem.
   */
  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.notifyMessagesUpdated())
    );
  }

  /**
   * Marca mensagem como lida.
   */
  markAsRead(id: number): Observable<Message> {
    return this.http.patch<Message>(`${this.baseUrl}/${id}/read`, {}).pipe(
      tap(() => this.notifyMessagesUpdated())
    );
  }

  /**
   * Marca mensagem como não lida.
   */
  markAsUnread(id: number): Observable<Message> {
    return this.http.patch<Message>(`${this.baseUrl}/${id}/unread`, {}).pipe(
      tap(() => this.notifyMessagesUpdated())
    );
  }

  /**
   * Marca todas as mensagens como lidas.
   */
  markAllAsRead(): Observable<{ message: string; markedCount: number }> {
    return this.http.patch<{ message: string; markedCount: number }>(`${this.baseUrl}/mark-all-read`, {}).pipe(
      tap(() => this.notifyMessagesUpdated())
    );
  }

  /**
   * Obtém estatísticas das mensagens do usuário atual.
   */
  getMessageStats(): Observable<MessageStats> {
    return this.http.get<MessageStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Obtém estatísticas gerais de mensagens (apenas ADMIN).
   */
  getAdminMessageStats(): Observable<AdminMessageStats> {
    return this.http.get<AdminMessageStats>(`${this.baseUrl}/stats/admin`);
  }

  /**
   * Força busca de mensagens externas (apenas ADMIN).
   */
  forceExternalMessageFetch(): Observable<{ 
    status: string; 
    message: string; 
    messagesImported: number; 
    timestamp: string 
  }> {
    return this.http.post<{ 
      status: string; 
      message: string; 
      messagesImported: number; 
      timestamp: string 
    }>(`${this.baseUrl}/external/force-fetch`, {}).pipe(
      tap(() => this.notifyMessagesUpdated())
    );
  }

  /**
   * Busca mensagens com filtros.
   */
  getFilteredMessages(filter: MessageFilter): Observable<Message[]> {
    let params = new HttpParams();
    
    if (filter.type) {
      params = params.set('type', filter.type);
    }
    if (filter.priority) {
      params = params.set('priority', filter.priority);
    }
    if (filter.isRead !== undefined) {
      params = params.set('isRead', filter.isRead.toString());
    }
    if (filter.isExternal !== undefined) {
      params = params.set('isExternal', filter.isExternal.toString());
    }
    if (filter.externalSource) {
      params = params.set('externalSource', filter.externalSource);
    }
    if (filter.userId) {
      params = params.set('userId', filter.userId.toString());
    }

    return this.http.get<Message[]>(this.baseUrl, { params });
  }

  /**
   * Conta mensagens não lidas (método auxiliar para uso local).
   */
  countUnreadMessages(messages: Message[]): number {
    return messages.filter(message => !message.isRead).length;
  }

  /**
   * Filtra mensagens por tipo.
   */
  filterMessagesByType(messages: Message[], type: string): Message[] {
    return messages.filter(message => message.type === type);
  }

  /**
   * Filtra mensagens por prioridade.
   */
  filterMessagesByPriority(messages: Message[], priority: string): Message[] {
    return messages.filter(message => message.priority === priority);
  }

  /**
   * Filtra mensagens não lidas.
   */
  filterUnreadMessages(messages: Message[]): Message[] {
    return messages.filter(message => !message.isRead);
  }

  /**
   * Filtra mensagens externas.
   */
  filterExternalMessages(messages: Message[]): Message[] {
    return messages.filter(message => message.isExternal);
  }

  /**
   * Filtra mensagens internas.
   */
  filterInternalMessages(messages: Message[]): Message[] {
    return messages.filter(message => !message.isExternal);
  }

  /**
   * Ordena mensagens por data (mais recentes primeiro).
   */
  sortMessagesByDate(messages: Message[]): Message[] {
    return messages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Ordena mensagens por prioridade e depois por data.
   */
  sortMessagesByPriority(messages: Message[]): Message[] {
    const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
    
    return messages.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                          (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Busca mensagens por texto (título ou conteúdo).
   */
  searchMessages(messages: Message[], searchTerm: string): Message[] {
    if (!searchTerm.trim()) return messages;
    
    const term = searchTerm.toLowerCase();
    return messages.filter(message => 
      message.title.toLowerCase().includes(term) ||
      message.content.toLowerCase().includes(term)
    );
  }

  /**
   * Agrupa mensagens por data.
   */
  groupMessagesByDate(messages: Message[]): { [date: string]: Message[] } {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  }

  /**
   * Agrupa mensagens por fonte externa.
   */
  groupMessagesBySource(messages: Message[]): { [source: string]: Message[] } {
    const groups: { [source: string]: Message[] } = {};
    
    messages.forEach(message => {
      const source = message.externalSource || 'Sistema Interno';
      if (!groups[source]) {
        groups[source] = [];
      }
      groups[source].push(message);
    });
    
    return groups;
  }

  /**
   * Notifica que as mensagens foram atualizadas.
   */
  private notifyMessagesUpdated(): void {
    this.messagesUpdatedSubject.next();
  }

  /**
   * Força atualização das mensagens (para uso externo).
   */
  public forceMessagesUpdate(): void {
    this.notifyMessagesUpdated();
  }
}