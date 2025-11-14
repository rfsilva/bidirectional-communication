import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationMessage } from '../models/data-entity.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SSEService {
  private eventSource: EventSource | null = null;
  private readonly baseUrl = 'http://localhost:8080/api/notifications/stream';
  
  private notificationsSubject = new BehaviorSubject<NotificationMessage | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // 🆕 Subject específico para notificações de mensagens
  private messageNotificationsSubject = new BehaviorSubject<NotificationMessage | null>(null);
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: any = null;

  public notifications$ = this.notificationsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  // 🆕 Observable específico para notificações de mensagens
  public messageNotifications$ = this.messageNotificationsSubject.asObservable();

  constructor(
    private ngZone: NgZone,
    private authService: AuthService
  ) {}

  connect(): void {
    // Aguardar inicialização do AuthService se necessário
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 SSE: Usuário não autenticado, aguardando...');
      
      // Aguardar um pouco e tentar novamente
      setTimeout(() => {
        if (this.authService.isAuthenticated()) {
          console.log('✅ SSE: Usuário autenticado, tentando conectar novamente');
          this.connect();
        } else {
          console.warn('🔒 SSE: Usuário ainda não autenticado após aguardar');
        }
      }, 1000);
      return;
    }

    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('📡 SSE: Já está conectado');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('🔒 SSE: Token JWT não encontrado');
      console.error('🔍 SSE: Debug de autenticação:', {
        isAuthenticated: this.authService.isAuthenticated(),
        hasCurrentUser: !!this.authService.getCurrentUser(),
        tokenExists: false
      });
      
      // Tentar obter token do servidor
      this.authService.getCurrentUserFromServer().subscribe({
        next: () => {
          console.log('✅ SSE: Token atualizado, tentando conectar novamente');
          setTimeout(() => this.connect(), 500);
        },
        error: (error) => {
          console.error('❌ SSE: Erro ao obter token do servidor:', error);
        }
      });
      return;
    }

    this.disconnect(); // Limpar conexão anterior se existir

    // Construir URL com token como query parameter (EventSource não suporta headers)
    const sseUrl = `${this.baseUrl}?token=${encodeURIComponent(token)}`;

    console.log(`🔄 SSE: Tentando conectar com autenticação`);
    console.log(`📊 SSE: Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1}`);
    console.log(`👤 SSE: Usuário: ${this.authService.getCurrentUser()?.username}`);
    console.log(`🔗 SSE: URL: ${this.baseUrl}?token=***`);
    
    try {
      this.eventSource = new EventSource(sseUrl);
      console.log('📡 SSE: EventSource criado com token JWT, aguardando conexão...');
      
      // Log do estado inicial
      console.log('🔍 SSE: Estado inicial:', this.getReadyStateText());

      this.eventSource.onopen = (event) => {
        this.ngZone.run(() => {
          console.log('✅ SSE: Conectado com sucesso e autenticado!', event);
          console.log('🔍 SSE: Estado da conexão:', this.getReadyStateText());
          console.log('👤 SSE: Usuário conectado:', this.authService.getCurrentUser()?.username);
          
          this.connectionStatusSubject.next(true);
          this.reconnectAttempts = 0;
          this.reconnectDelay = 3000;
          
          // Limpar timer de reconexão se existir
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
        });
      };

      this.eventSource.onmessage = (event: MessageEvent) => {
        this.ngZone.run(() => {
          try {
            console.log('📨 SSE: Mensagem recebida (raw):', event.data);
            const message: NotificationMessage = JSON.parse(event.data);
            console.log('📨 SSE: Mensagem processada:', message);
            this.notificationsSubject.next(message);
          } catch (error) {
            console.error('❌ SSE: Erro ao processar mensagem:', error);
            console.error('📄 SSE: Dados recebidos:', event.data);
          }
        });
      };

      // Listeners para eventos específicos
      this.setupEventListeners();

      this.eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('❌ SSE: Erro na conexão:', error);
          console.error('🔍 SSE: Estado da conexão:', this.getReadyStateText());
          console.error('🔍 SSE: Status de autenticação:', {
            isAuthenticated: this.authService.isAuthenticated(),
            hasToken: !!this.authService.getToken(),
            currentUser: this.authService.getCurrentUser()?.username || 'nenhum'
          });
          
          this.connectionStatusSubject.next(false);
          
          // Verificar se é um erro de rede ou servidor
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            console.error('🔒 SSE: Conexão foi fechada pelo servidor ou erro de rede');
            
            // Verificar se o token ainda é válido
            if (!this.authService.isAuthenticated()) {
              console.error('🔒 SSE: Token expirado ou usuário deslogado, não reconectando');
              return;
            }
            
            // Verificar se o token ainda é válido no servidor
            this.authService.validateToken().subscribe({
              next: (isValid) => {
                if (!isValid) {
                  console.error('🔒 SSE: Token inválido no servidor, não reconectando');
                  this.authService.forceLogout();
                  return;
                }
                
                // Token válido, tentar reconectar
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                  this.reconnectAttempts++;
                  console.log(`🔄 SSE: Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${this.reconnectDelay}ms`);
                  
                  this.reconnectTimer = setTimeout(() => {
                    // Verificar novamente se ainda está autenticado antes de reconectar
                    if (this.authService.isAuthenticated()) {
                      console.log('🔄 SSE: Reconectando (usuário ainda autenticado)...');
                      this.connect();
                    } else {
                      console.warn('🔒 SSE: Usuário não está mais autenticado, cancelando reconexão');
                    }
                  }, this.reconnectDelay);
                  
                  // Aumentar delay progressivamente
                  this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
                } else {
                  console.error('💀 SSE: Máximo de tentativas de reconexão atingido');
                  console.error('🔧 SSE: Verifique se o servidor está rodando e o token é válido');
                }
              },
              error: (error) => {
                console.error('❌ SSE: Erro ao validar token:', error);
                this.authService.forceLogout();
              }
            });
          }
        });
      };

    } catch (error) {
      console.error('💥 SSE: Erro ao criar EventSource:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // Eventos existentes
    const eventTypes = ['connection', 'dataUpdate', 'error', 'info'];
    
    eventTypes.forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event: Event) => {
        this.ngZone.run(() => {
          try {
            const messageEvent = event as MessageEvent;
            console.log(`📨 SSE: Evento '${eventType}' recebido:`, messageEvent.data);
            const message: NotificationMessage = JSON.parse(messageEvent.data);
            this.notificationsSubject.next(message);
          } catch (error) {
            console.error(`❌ SSE: Erro ao processar evento '${eventType}':`, error);
          }
        });
      });
    });

    // 🆕 Listener específico para notificações de mensagens
    this.eventSource.addEventListener('newMessage', (event: Event) => {
      this.ngZone.run(() => {
        try {
          const messageEvent = event as MessageEvent;
          console.log('📨 SSE: Nova mensagem recebida:', messageEvent.data);
          const message: NotificationMessage = JSON.parse(messageEvent.data);
          
          // Emitir tanto no canal geral quanto no específico de mensagens
          this.notificationsSubject.next(message);
          this.messageNotificationsSubject.next(message);
          
          console.log('🔔 SSE: Notificação de nova mensagem processada:', {
            type: message.type,
            message: message.message,
            data: message.data
          });
          
        } catch (error) {
          console.error('❌ SSE: Erro ao processar notificação de nova mensagem:', error);
        }
      });
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.eventSource) {
      console.log('🔌 SSE: Desconectando...');
      this.eventSource.close();
      this.eventSource = null;
      this.connectionStatusSubject.next(false);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 3000;
      console.log('✅ SSE: Desconectado');
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  getConnectionState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED;
  }

  getReadyStateText(): string {
    const state = this.getConnectionState();
    switch (state) {
      case EventSource.CONNECTING:
        return 'CONNECTING (0)';
      case EventSource.OPEN:
        return 'OPEN (1)';
      case EventSource.CLOSED:
        return 'CLOSED (2)';
      default:
        return `UNKNOWN (${state})`;
    }
  }

  forceReconnect(): void {
    console.log('🔄 SSE: Forçando reconexão...');
    
    // Verificar autenticação antes de reconectar
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 SSE: Usuário não autenticado, reconexão cancelada');
      return;
    }
    
    this.reconnectAttempts = 0;
    this.reconnectDelay = 3000;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  // 🆕 Método para obter apenas notificações de mensagens
  getMessageNotifications(): Observable<NotificationMessage | null> {
    return this.messageNotifications$;
  }

  // 🆕 Método para limpar notificações de mensagens
  clearMessageNotifications(): void {
    this.messageNotificationsSubject.next(null);
  }

  // Método para debug - mostra informações detalhadas
  getDebugInfo(): any {
    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();
    
    return {
      url: this.baseUrl,
      connected: this.isConnected(),
      readyState: this.getReadyStateText(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectDelay: this.reconnectDelay,
      hasEventSource: !!this.eventSource,
      hasReconnectTimer: !!this.reconnectTimer,
      auth: {
        isAuthenticated: this.authService.isAuthenticated(),
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        currentUser: currentUser?.username || 'nenhum',
        userRole: currentUser?.role || 'nenhuma'
      }
    };
  }
}