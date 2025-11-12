import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { NotificationMessage } from '../models/data-entity.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private readonly wsUrl = 'http://localhost:8080/ws';
  
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
      console.log('WebSocket já está conectado');
      return;
    }

    this.disconnect();

    console.log(`🔄 Tentando conectar ao WebSocket: ${this.wsUrl}`);
    console.log(`📊 Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1}`);
    
    try {
      this.client = new Client({
        webSocketFactory: () => {
          console.log('🏭 Criando SockJS connection...');
          return new SockJS(this.wsUrl);
        },
        connectHeaders: {},
        debug: (str) => {
          console.log('🔍 STOMP Debug:', str);
        },
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: (frame) => {
          this.ngZone.run(() => {
            console.log('✅ WebSocket conectado com sucesso!', frame);
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
            console.error('❌ Erro STOMP:', frame);
            console.error('📄 Headers:', frame.headers);
            console.error('📄 Body:', frame.body);
            this.connectionStatusSubject.next(false);
            this.handleReconnection();
          });
        },
        
        onWebSocketError: (error) => {
          this.ngZone.run(() => {
            console.error('❌ Erro WebSocket:', error);
            this.connectionStatusSubject.next(false);
            this.handleReconnection();
          });
        },
        
        onWebSocketClose: (event) => {
          this.ngZone.run(() => {
            console.log('🔌 WebSocket fechado:', event);
            this.connectionStatusSubject.next(false);
          });
        },
        
        onDisconnect: (frame) => {
          this.ngZone.run(() => {
            console.log('🔌 WebSocket desconectado:', frame);
            this.connectionStatusSubject.next(false);
          });
        }
      });

      console.log('🚀 Ativando cliente STOMP...');
      this.client.activate();

    } catch (error) {
      console.error('💥 Erro ao criar cliente WebSocket:', error);
      this.connectionStatusSubject.next(false);
      this.handleReconnection();
    }
  }

  private subscribeToNotifications(): void {
    if (!this.client?.connected) {
      console.error('❌ Cliente não está conectado para subscrição');
      return;
    }

    console.log('📡 Subscrevendo ao tópico de notificações...');
    
    try {
      const subscription = this.client.subscribe('/topic/notifications', (message: IMessage) => {
        this.ngZone.run(() => {
          try {
            console.log('📨 Mensagem WebSocket recebida (raw):', message.body);
            const notification: NotificationMessage = JSON.parse(message.body);
            console.log('📨 Mensagem WebSocket processada:', notification);
            this.notificationsSubject.next(notification);
          } catch (error) {
            console.error('❌ Erro ao processar mensagem WebSocket:', error);
            console.error('📄 Dados recebidos:', message.body);
          }
        });
      });
      
      console.log('✅ Subscrito ao tópico /topic/notifications', subscription);
    } catch (error) {
      console.error('❌ Erro ao subscrever ao tópico:', error);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${this.reconnectDelay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
    } else {
      console.error('💀 Máximo de tentativas de reconexão atingido');
      console.error('🔧 Verifique se o servidor está rodando em:', this.wsUrl);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.client) {
      console.log('🔌 Desconectando WebSocket...');
      try {
        if (this.client.connected) {
          this.client.deactivate();
        }
      } catch (error) {
        console.error('Erro ao desconectar:', error);
      }
      this.client = null;
      this.connectionStatusSubject.next(false);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 3000;
      console.log('✅ WebSocket desconectado');
    }
  }

  sendMessage(destination: string, message: any): void {
    if (!this.client?.connected) {
      console.error('❌ WebSocket não está conectado');
      return;
    }

    try {
      console.log(`📤 Enviando mensagem para ${destination}:`, message);
      this.client.publish({
        destination: `/app/${destination}`,
        body: JSON.stringify(message)
      });
      console.log('✅ Mensagem enviada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WebSocket:', error);
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
    console.log('🔄 Forçando reconexão WebSocket...');
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
      clientState: this.client?.state || 'NO_CLIENT'
    };
  }
}