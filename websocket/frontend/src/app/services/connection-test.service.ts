import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Client } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectionTestService {
  private readonly baseUrl = 'http://localhost:8080';
  private readonly wsUrl = 'ws://localhost:8080/ws';

  constructor(private http: HttpClient) {}

  // Testa se o servidor está rodando
  testServerConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/health`, { 
      responseType: 'text',
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      timeout(5000),
      catchError(error => {
        console.error('Erro ao conectar com o servidor:', error);
        return of({ error: true, message: error.message });
      })
    );
  }

  // Testa o endpoint WebSocket diretamente
  testWebSocketEndpoint(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/websocket/status`, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      timeout(5000),
      catchError(error => {
        console.error('Erro ao acessar endpoint WebSocket:', error);
        return of({ error: true, message: error.message });
      })
    );
  }

  // Testa CORS
  testCORS(): Observable<any> {
    return this.http.options(`${this.baseUrl}/api/websocket/status`).pipe(
      timeout(5000),
      catchError(error => {
        console.error('Erro de CORS:', error);
        return of({ error: true, message: error.message });
      })
    );
  }

  // Teste completo de conectividade
  runFullConnectivityTest(): void {
    console.log('=== TESTE DE CONECTIVIDADE WEBSOCKET ===');
    
    // Teste 1: Servidor básico
    console.log('1. Testando conexão com servidor...');
    this.testServerConnection().subscribe({
      next: (response) => {
        if (response.error) {
          console.error('❌ Servidor não está respondendo:', response.message);
        } else {
          console.log('✅ Servidor está rodando:', response);
        }
      },
      error: (error) => {
        console.error('❌ Erro na conexão com servidor:', error);
      }
    });

    // Teste 2: Endpoint WebSocket
    console.log('2. Testando endpoint WebSocket...');
    this.testWebSocketEndpoint().subscribe({
      next: (response) => {
        if (response.error) {
          console.error('❌ Endpoint WebSocket não está acessível:', response.message);
        } else {
          console.log('✅ Endpoint WebSocket está acessível:', response);
        }
      },
      error: (error) => {
        console.error('❌ Erro no endpoint WebSocket:', error);
      }
    });

    // Teste 3: WebSocket manual
    console.log('3. Testando WebSocket manual...');
    this.testWebSocketManual();
  }

  private testWebSocketManual(): void {
    const client = new Client({
      brokerURL: this.wsUrl,
      debug: (str) => console.log('🔍 Test WebSocket Debug:', str),
      reconnectDelay: 0,
      onConnect: (frame) => {
        console.log('✅ WebSocket de teste conectado com sucesso', frame);
        
        // Testar subscrição
        client.subscribe('/topic/notifications', (message) => {
          console.log('📨 Mensagem de teste recebida:', message.body);
        });
        
        // Enviar mensagem de teste
        client.publish({
          destination: '/app/test',
          body: JSON.stringify({ message: 'Teste de conectividade' })
        });
        
        // Desconectar após 3 segundos
        setTimeout(() => {
          client.deactivate();
          console.log('✅ Teste WebSocket concluído');
        }, 3000);
      },
      onStompError: (frame) => {
        console.error('❌ Erro STOMP no teste:', frame);
        client.deactivate();
      },
      onWebSocketError: (error) => {
        console.error('❌ Erro WebSocket no teste:', error);
        client.deactivate();
      }
    });

    const timeout = setTimeout(() => {
      console.error('❌ Timeout na conexão WebSocket de teste');
      client.deactivate();
    }, 10000);

    try {
      client.activate();
    } catch (error) {
      console.error('❌ Erro ao ativar cliente WebSocket de teste:', error);
      clearTimeout(timeout);
    }
  }
}