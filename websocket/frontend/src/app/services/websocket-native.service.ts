import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import { NotificationMessage } from '../models/data-entity.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketNativeService {
  private client: Client | null = null;
  private readonly wsUrl = 'ws://localhost:8080/ws-native'; // WebSocket nativo
  
  private notificationsSubject = new BehaviorSubject<NotificationMessage | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: any = null;

  public notifications$ = this.notificationsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  connect(): void {
    if (this.client?.connected) {
      console.log('WebSocket nativo já está conectado');
      return;
    }

    this.disconnect();

    console.log(`🔄 Conectando ao WebSocket nativo: ${this.wsUrl}`);
    console.log(`📊 Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1}`);
    
    try {
      this.client = new Client({
        brokerURL: this.wsUrl, // Usar WebSocket nativo diretamente
        connectHeaders: {},
        debug: (str) => {
          console.log('🔍 STOMP Native Debug:', str);
        },
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: (frame) => {
          this.ngZone.run(() => {
            console.log('✅ WebSocket nativo conectado com sucesso!', frame);
            this.connectionStatusSubject.next(true);
            this.reconnectAttempts = 0;
            this.reconnectDelay = 3000;
            
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }

            this.subscribeToNotifications();
          });
        },
        
        onStompError: (frame) => {
          this.ngZone.run(() => {
            console.error('❌ Erro STOMP nativo:', frame);
            this.connectionStatusSubject.next(false);
            this.handleReconnection();
          });
        },
        
        onWebSocketError: (error) => {
          this.ngZone.run(() => {
            console.error('❌ Erro WebSocket nativo:', error);
            this.connectionStatusSubject.next(false);
            this.handleReconnection();
          });
        },
        
        onWebSocketClose: (event) => {
          this.ngZone.run(() => {
            console.log('🔌 WebSocket nativo fechado:', event);
            this.connectionStatusSubject.next(false);
          });
        },
        
        onDisconnect: (frame) => {
          this.ngZone.run(() => {
            console.log('🔌 WebSocket nativo desconectado:', frame);
            this.connectionStatusSubject.next(false);
          });
        }
      });

      console.log('🚀 Ativando cliente STOMP nativo...');
      this.client.activate();

    } catch (error) {
      console.error('💥 Erro ao criar cliente WebSocket nativo:', error);
      this.connectionStatusSubject.next(false);
      this.handleReconnection();
    }
  }

  private subscribeToNotifications(): void {
    if (!this.client?.connected) {
      console.error('❌ Cliente nativo não está conectado para subscrição');
      return;
    }

    console.log('📡 Subscrevendo ao tópico de notificações (nativo)...');
    
    try {
      const subscription = this.client.subscribe('/topic/notifications', (message) => {
        this.ngZone.run(() => {
          try {
            console.log('📨 Mensagem WebSocket nativo recebida (raw):', message.body);
            const notification: NotificationMessage = JSON.parse(message.body);
            console.log('📨 Mensagem WebSocket nativo processada:', notification);
            this.notificationsSubject.next(notification);
          } catch (error) {
            console.error('❌ Erro ao processar mensagem WebSocket nativo:', error);
            console.error('📄 Dados recebidos:', message.body);
          }
        });
      });
      
      console.log('✅ Subscrito ao tópico /topic/notifications (nativo)', subscription);
    } catch (error) {
      console.error('❌ Erro ao subscrever ao tópico (nativo):', error);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentativa de reconexão nativa ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${this.reconnectDelay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
    } else {
      console.error('💀 Máximo de tentativas de reconexão nativa atingido');
      console.error('🔧 Verifique se o servidor está rodando em:', this.wsUrl);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.client) {
      console.log('🔌 Desconectando WebSocket nativo...');
      try {
        if (this.client.connected) {
          this.client.deactivate();
        }
      } catch (error) {
        console.error('Erro ao desconectar nativo:', error);
      }
      this.client = null;
      this.connectionStatusSubject.next(false);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 3000;
      console.log('✅ WebSocket nativo desconectado');
    }
  }

  sendMessage(destination: string, message: any): void {
    if (!this.client?.connected) {
      console.error('❌ WebSocket nativo não está conectado');
      return;
    }

    try {
      console.log(`📤 Enviando mensagem nativa para ${destination}:`, message);
      this.client.publish({
        destination: `/app/${destination}`,
        body: JSON.stringify(message)
      });
      console.log('✅ Mensagem nativa enviada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WebSocket nativa:', error);
    }
  }

  sendTestMessage(message: string): void {
    this.sendMessage('test', { message });
  }

  sendForceExternalFetch(): void {
    this.sendMessage('force-fetch', {});
  }

  sendPing(): void {
    this.sendMessage('ping', {});
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  getConnectionState(): string {
    if (!this.client) return 'DISCONNECTED';
    return this.client.connected ? 'CONNECTED' : 'DISCONNECTED';
  }

  forceReconnect(): void {
    console.log('🔄 Forçando reconexão WebSocket nativa...');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 3000;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  getDebugInfo(): any {
    return {
      url: this.wsUrl,
      connected: this.isConnected(),
      state: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectDelay: this.reconnectDelay,
      hasClient: !!this.client,
      hasReconnectTimer: !!this.reconnectTimer,
      clientState: this.client?.state || 'NO_CLIENT',
      type: 'native-websocket'
    };
  }
}