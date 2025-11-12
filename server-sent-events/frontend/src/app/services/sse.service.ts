import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationMessage } from '../models/data-entity.model';

@Injectable({
  providedIn: 'root'
})
export class SSEService {
  private eventSource: EventSource | null = null;
  private readonly sseUrl = 'http://localhost:8080/api/notifications/stream';
  
  private notificationsSubject = new BehaviorSubject<NotificationMessage | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  public notifications$ = this.notificationsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('SSE já está conectado');
      return;
    }

    this.disconnect(); // Limpar conexão anterior se existir

    console.log(`🔄 Tentando conectar ao SSE: ${this.sseUrl}`);
    console.log(`📊 Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1}`);
    
    try {
      this.eventSource = new EventSource(this.sseUrl);
      console.log('📡 EventSource criado, aguardando conexão...');
      
      // Log do estado inicial
      console.log('🔍 Estado inicial do EventSource:', this.getReadyStateText());

      this.eventSource.onopen = (event) => {
        this.ngZone.run(() => {
          console.log('✅ SSE conectado com sucesso!', event);
          console.log('🔍 Estado da conexão:', this.getReadyStateText());
          this.connectionStatusSubject.next(true);
          this.reconnectAttempts = 0;
          this.reconnectDelay = 3000;
        });
      };

      this.eventSource.onmessage = (event: MessageEvent) => {
        this.ngZone.run(() => {
          try {
            console.log('📨 Mensagem SSE recebida (raw):', event.data);
            const message: NotificationMessage = JSON.parse(event.data);
            console.log('📨 Mensagem SSE processada:', message);
            this.notificationsSubject.next(message);
          } catch (error) {
            console.error('❌ Erro ao processar mensagem SSE:', error);
            console.error('📄 Dados recebidos:', event.data);
          }
        });
      };

      // Listeners para eventos específicos
      this.setupEventListeners();

      this.eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('❌ Erro na conexão SSE:', error);
          console.error('🔍 Estado da conexão:', this.getReadyStateText());
          console.error('🔍 URL tentada:', this.sseUrl);
          
          this.connectionStatusSubject.next(false);
          
          // Verificar se é um erro de rede ou servidor
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            console.error('🔒 Conexão foi fechada pelo servidor ou erro de rede');
          }
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${this.reconnectDelay}ms`);
            
            setTimeout(() => {
              this.connect();
            }, this.reconnectDelay);
            
            // Aumentar delay progressivamente
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
          } else {
            console.error('💀 Máximo de tentativas de reconexão atingido');
            console.error('🔧 Verifique se o servidor está rodando em:', this.sseUrl);
          }
        });
      };

    } catch (error) {
      console.error('💥 Erro ao criar EventSource:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  private setupEventListeners(): void {
    if (!this.eventSource) return;

    const eventTypes = ['connection', 'dataUpdate', 'error', 'info'];
    
    eventTypes.forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event: Event) => {
        this.ngZone.run(() => {
          try {
            const messageEvent = event as MessageEvent;
            console.log(`📨 Evento '${eventType}' recebido:`, messageEvent.data);
            const message: NotificationMessage = JSON.parse(messageEvent.data);
            this.notificationsSubject.next(message);
          } catch (error) {
            console.error(`❌ Erro ao processar evento '${eventType}':`, error);
          }
        });
      });
    });
  }

  disconnect(): void {
    if (this.eventSource) {
      console.log('🔌 Desconectando SSE...');
      this.eventSource.close();
      this.eventSource = null;
      this.connectionStatusSubject.next(false);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 3000;
      console.log('✅ SSE desconectado');
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
    console.log('🔄 Forçando reconexão SSE...');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 3000;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  // Método para debug - mostra informações detalhadas
  getDebugInfo(): any {
    return {
      url: this.sseUrl,
      connected: this.isConnected(),
      readyState: this.getReadyStateText(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectDelay: this.reconnectDelay,
      hasEventSource: !!this.eventSource
    };
  }
}