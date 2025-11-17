import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationMessage } from '../models/data-entity.model';
import { AuthService } from './auth.service';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private readonly baseUrl = 'http://localhost:8080/ws';
  
  private notificationsSubject = new BehaviorSubject<NotificationMessage | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // Subject específico para notificações de mensagens
  private messageNotificationsSubject = new BehaviorSubject<NotificationMessage | null>(null);
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: any = null;

  public notifications$ = this.notificationsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public messageNotifications$ = this.messageNotificationsSubject.asObservable();

  constructor(
    private ngZone: NgZone,
    private authService: AuthService
  ) {}

  connect(): void {
    // Aguardar inicialização do AuthService se necessário
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 WebSocket: Usuário não autenticado, aguardando...');
      
      // Aguardar um pouco e tentar novamente
      setTimeout(() => {
        if (this.authService.isAuthenticated()) {
          console.log('✅ WebSocket: Usuário autenticado, tentando conectar novamente');
          this.connect();
        } else {
          console.warn('🔒 WebSocket: Usuário ainda não autenticado após aguardar');
        }
      }, 1000);
      return;
    }

    if (this.stompClient?.connected) {
      console.log('📡 WebSocket: Já está conectado');
      return;
    }

    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();
    
    if (!token || !currentUser) {
      console.error('🔒 WebSocket: Token JWT ou usuário não encontrado');
      console.error('🔍 WebSocket: Debug de autenticação:', {
        isAuthenticated: this.authService.isAuthenticated(),
        hasCurrentUser: !!currentUser,
        tokenExists: !!token,
        userId: currentUser?.id,
        username: currentUser?.username
      });
      
      // Tentar obter token do servidor
      this.authService.getCurrentUserFromServer().subscribe({
        next: () => {
          console.log('✅ WebSocket: Token atualizado, tentando conectar novamente');
          setTimeout(() => this.connect(), 500);
        },
        error: (error) => {
          console.error('❌ WebSocket: Erro ao obter token do servidor:', error);
        }
      });
      return;
    }

    this.disconnect(); // Limpar conexão anterior se existir

    console.log(`🔄 WebSocket: Tentando conectar com autenticação`);
    console.log(`📊 WebSocket: Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1}`);
    console.log(`👤 WebSocket: Usuário: ${currentUser.username} (ID: ${currentUser.id})`);
    console.log(`🔗 WebSocket: URL: ${this.baseUrl}?token=***`);
    
    try {
      // Configuração do STOMP client
      this.stompClient = new Client({
        // Usar SockJS como transporte
        webSocketFactory: () => {
          try {
            return new SockJS(`${this.baseUrl}?token=${encodeURIComponent(token)}`);
          } catch (error) {
            console.error('❌ WebSocket: Erro ao criar SockJS:', error);
            throw error;
          }
        },
        
        // Headers de conexão STOMP
        connectHeaders: {
          'Authorization': `Bearer ${token}`,
          'userId': currentUser.id.toString(),
          'username': currentUser.username
        },
        
        // Configurações de reconexão
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        // Callbacks
        onConnect: (frame) => {
          this.ngZone.run(() => {
            console.log('✅ WebSocket: Conectado com sucesso!', frame);
            console.log('👤 WebSocket: Usuário conectado:', currentUser.username, 'ID:', currentUser.id);
            
            this.connectionStatusSubject.next(true);
            this.reconnectAttempts = 0;
            this.reconnectDelay = 3000;
            
            // Limpar timer de reconexão se existir
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }
            
            // Configurar subscriptions
            this.setupSubscriptions();
            
            // Enviar mensagem de conexão
            this.sendConnectMessage();
          });
        },
        
        onStompError: (frame) => {
          this.ngZone.run(() => {
            console.error('❌ WebSocket: Erro STOMP:', frame);
            this.connectionStatusSubject.next(false);
            this.handleConnectionError();
          });
        },
        
        onWebSocketError: (error) => {
          this.ngZone.run(() => {
            console.error('❌ WebSocket: Erro WebSocket:', error);
            this.connectionStatusSubject.next(false);
            this.handleConnectionError();
          });
        },
        
        onDisconnect: (frame) => {
          this.ngZone.run(() => {
            console.log('🔌 WebSocket: Desconectado', frame);
            this.connectionStatusSubject.next(false);
          });
        },
        
        debug: (str) => {
          console.log('🐛 WebSocket Debug:', str);
        }
      });

      this.stompClient.activate();
      
    } catch (error) {
      console.error('💥 WebSocket: Erro ao criar cliente STOMP:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  private setupSubscriptions(): void {
    if (!this.stompClient?.connected) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    try {
      console.log('🔧 WebSocket: Configurando subscriptions para usuário:', currentUser.username, 'ID:', currentUser.id);

      // Subscription para mensagens broadcast (todos os usuários)
      console.log('📡 WebSocket: Subscribing to /topic/dataUpdate');
      this.stompClient.subscribe('/topic/dataUpdate', (message: IMessage) => {
        this.ngZone.run(() => {
          console.log('📨 WebSocket: Mensagem broadcast dataUpdate recebida');
          this.handleMessage('dataUpdate', message);
        });
      });

      console.log('📡 WebSocket: Subscribing to /topic/error');
      this.stompClient.subscribe('/topic/error', (message: IMessage) => {
        this.ngZone.run(() => {
          console.log('📨 WebSocket: Mensagem broadcast error recebida');
          this.handleMessage('error', message);
        });
      });

      console.log('📡 WebSocket: Subscribing to /topic/info');
      this.stompClient.subscribe('/topic/info', (message: IMessage) => {
        this.ngZone.run(() => {
          console.log('📨 WebSocket: Mensagem broadcast info recebida');
          this.handleMessage('info', message);
        });
      });

      // CORRIGIDO: Subscriptions para mensagens individuais do usuário
      // Usar apenas o formato padrão do Spring WebSocket
      const userDestination = `/user/queue/newMessage`;
      console.log(`📡 WebSocket: Subscribing to ${userDestination}`);
      this.stompClient.subscribe(userDestination, (message: IMessage) => {
        this.ngZone.run(() => {
          console.log(`📨 WebSocket: ✅ MENSAGEM ESPECÍFICA RECEBIDA em ${userDestination}:`, message.body);
          this.handleMessage('newMessage', message);
        });
      });

      const connectionDestination = `/user/queue/connection`;
      console.log(`📡 WebSocket: Subscribing to ${connectionDestination}`);
      this.stompClient.subscribe(connectionDestination, (message: IMessage) => {
        this.ngZone.run(() => {
          console.log(`📨 WebSocket: ✅ MENSAGEM DE CONEXÃO RECEBIDA em ${connectionDestination}:`, message.body);
          this.handleMessage('connection', message);
        });
      });

      // ADICIONAL: Tentar também outros formatos para debug
      const alternativeDestinations = [
        `/user/${currentUser.id}/queue/newMessage`,
        `/queue/newMessage-${currentUser.id}`,
        `/topic/user-${currentUser.id}`
      ];

      alternativeDestinations.forEach(destination => {
        console.log(`📡 WebSocket: Subscribing to alternative destination: ${destination}`);
        this.stompClient!.subscribe(destination, (message: IMessage) => {
          this.ngZone.run(() => {
            console.log(`📨 WebSocket: ✅ MENSAGEM ALTERNATIVA RECEBIDA em ${destination}:`, message.body);
            this.handleMessage('newMessage', message);
          });
        });
      });

      console.log('✅ WebSocket: Todas as subscriptions configuradas para usuário:', currentUser.username);
    } catch (error) {
      console.error('❌ WebSocket: Erro ao configurar subscriptions:', error);
    }
  }

  private handleMessage(eventType: string, message: IMessage): void {
    try {
      console.log(`📨 WebSocket: 🎯 PROCESSANDO MENSAGEM '${eventType}':`, message.body);
      const notificationMessage: NotificationMessage = JSON.parse(message.body);
      
      // Emitir no canal geral
      this.notificationsSubject.next(notificationMessage);
      console.log(`📤 WebSocket: Mensagem '${eventType}' emitida no canal geral`);
      
      // Se for uma mensagem nova, emitir também no canal específico
      if (eventType === 'newMessage') {
        this.messageNotificationsSubject.next(notificationMessage);
        console.log('🔔 WebSocket: ✅ NOTIFICAÇÃO DE NOVA MENSAGEM PROCESSADA E EMITIDA:', {
          type: notificationMessage.type,
          message: notificationMessage.message,
          data: notificationMessage.data
        });
      }
      
    } catch (error) {
      console.error(`❌ WebSocket: Erro ao processar mensagem '${eventType}':`, error);
    }
  }

  private sendConnectMessage(): void {
    if (!this.stompClient?.connected) return;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    
    try {
      const connectPayload = {
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        username: currentUser.username
      };
      
      console.log('📤 WebSocket: Enviando mensagem de conexão:', connectPayload);
      
      this.stompClient.publish({
        destination: '/app/connect',
        body: JSON.stringify(connectPayload)
      });
      
      console.log('✅ WebSocket: Mensagem de conexão enviada com sucesso');
    } catch (error) {
      console.error('❌ WebSocket: Erro ao enviar mensagem de conexão:', error);
    }
  }

  private handleConnectionError(): void {
    // Verificar se o token ainda é válido
    if (!this.authService.isAuthenticated()) {
      console.error('🔒 WebSocket: Token expirado ou usuário deslogado, não reconectando');
      return;
    }
    
    // Verificar se o token ainda é válido no servidor
    this.authService.validateToken().subscribe({
      next: (isValid) => {
        if (!isValid) {
          console.error('🔒 WebSocket: Token inválido no servidor, não reconectando');
          this.authService.forceLogout();
          return;
        }
        
        // Token válido, tentar reconectar
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 WebSocket: Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${this.reconnectDelay}ms`);
          
          this.reconnectTimer = setTimeout(() => {
            // Verificar novamente se ainda está autenticado antes de reconectar
            if (this.authService.isAuthenticated()) {
              console.log('🔄 WebSocket: Reconectando (usuário ainda autenticado)...');
              this.connect();
            } else {
              console.warn('🔒 WebSocket: Usuário não está mais autenticado, cancelando reconexão');
            }
          }, this.reconnectDelay);
          
          // Aumentar delay progressivamente
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
        } else {
          console.error('💀 WebSocket: Máximo de tentativas de reconexão atingido');
          console.error('🔧 WebSocket: Verifique se o servidor está rodando e o token é válido');
        }
      },
      error: (error) => {
        console.error('❌ WebSocket: Erro ao validar token:', error);
        this.authService.forceLogout();
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.stompClient) {
      console.log('🔌 WebSocket: Desconectando...');
      
      // Enviar mensagem de desconexão se conectado
      if (this.stompClient.connected) {
        try {
          const currentUser = this.authService.getCurrentUser();
          this.stompClient.publish({
            destination: '/app/disconnect',
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              userId: currentUser?.id,
              username: currentUser?.username
            })
          });
        } catch (error) {
          console.error('❌ WebSocket: Erro ao enviar mensagem de desconexão:', error);
        }
      }
      
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connectionStatusSubject.next(false);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 3000;
      console.log('✅ WebSocket: Desconectado');
    }
  }

  isConnected(): boolean {
    return this.stompClient?.connected ?? false;
  }

  getConnectionState(): string {
    if (!this.stompClient) return 'DISCONNECTED';
    return this.stompClient.connected ? 'CONNECTED' : 'CONNECTING';
  }

  forceReconnect(): void {
    console.log('🔄 WebSocket: Forçando reconexão...');
    
    // Verificar autenticação antes de reconectar
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 WebSocket: Usuário não autenticado, reconexão cancelada');
      return;
    }
    
    this.reconnectAttempts = 0;
    this.reconnectDelay = 3000;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  // Método para obter apenas notificações de mensagens
  getMessageNotifications(): Observable<NotificationMessage | null> {
    return this.messageNotifications$;
  }

  // Método para limpar notificações de mensagens
  clearMessageNotifications(): void {
    this.messageNotificationsSubject.next(null);
  }

  // Método para enviar ping (keepalive)
  sendPing(): void {
    if (!this.stompClient?.connected) return;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      this.stompClient.publish({
        destination: '/app/ping',
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          userId: currentUser?.id,
          username: currentUser?.username
        })
      });
      console.log('📤 WebSocket: Ping enviado');
    } catch (error) {
      console.error('❌ WebSocket: Erro ao enviar ping:', error);
    }
  }

  // Método para debug - mostra informações detalhadas
  getDebugInfo(): any {
    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();
    
    return {
      url: this.baseUrl,
      connected: this.isConnected(),
      connectionState: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectDelay: this.reconnectDelay,
      hasStompClient: !!this.stompClient,
      hasReconnectTimer: !!this.reconnectTimer,
      auth: {
        isAuthenticated: this.authService.isAuthenticated(),
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        currentUser: currentUser?.username || 'nenhum',
        userId: currentUser?.id || 'nenhum',
        userRole: currentUser?.role || 'nenhuma'
      }
    };
  }
}