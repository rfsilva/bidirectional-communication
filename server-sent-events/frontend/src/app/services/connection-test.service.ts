import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConnectionTestService {
  private readonly baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Testa se o servidor está rodando
  testServerConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/health`, { 
      responseType: 'text',
      headers: {
        'Accept': 'text/plain'
      }
    }).pipe(
      timeout(5000),
      catchError(error => {
        console.error('Erro ao conectar com o servidor:', error);
        return of({ error: true, message: error.message });
      })
    );
  }

  // Testa o endpoint SSE diretamente
  testSSEEndpoint(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/notifications/stream`, {
      responseType: 'text',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    }).pipe(
      timeout(5000),
      catchError(error => {
        console.error('Erro ao acessar endpoint SSE:', error);
        return of({ error: true, message: error.message });
      })
    );
  }

  // Testa CORS
  testCORS(): Observable<any> {
    return this.http.options(`${this.baseUrl}/api/notifications/stream`).pipe(
      timeout(5000),
      catchError(error => {
        console.error('Erro de CORS:', error);
        return of({ error: true, message: error.message });
      })
    );
  }

  // Teste completo de conectividade
  runFullConnectivityTest(): void {
    console.log('=== TESTE DE CONECTIVIDADE ===');
    
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

    // Teste 2: Endpoint SSE
    console.log('2. Testando endpoint SSE...');
    this.testSSEEndpoint().subscribe({
      next: (response) => {
        if (response.error) {
          console.error('❌ Endpoint SSE não está acessível:', response.message);
        } else {
          console.log('✅ Endpoint SSE está acessível');
        }
      },
      error: (error) => {
        console.error('❌ Erro no endpoint SSE:', error);
      }
    });

    // Teste 3: EventSource manual
    console.log('3. Testando EventSource manual...');
    this.testEventSourceManual();
  }

  private testEventSourceManual(): void {
    const eventSource = new EventSource(`${this.baseUrl}/api/notifications/stream`);
    
    const timeout = setTimeout(() => {
      console.error('❌ Timeout na conexão EventSource');
      eventSource.close();
    }, 10000);

    eventSource.onopen = (event) => {
      console.log('✅ EventSource conectado com sucesso', event);
      clearTimeout(timeout);
      setTimeout(() => eventSource.close(), 2000); // Fechar após 2 segundos
    };

    eventSource.onmessage = (event) => {
      console.log('📨 Mensagem recebida via EventSource:', event.data);
    };

    eventSource.onerror = (error) => {
      console.error('❌ Erro no EventSource:', error);
      console.error('ReadyState:', eventSource.readyState);
      clearTimeout(timeout);
      eventSource.close();
    };
  }
}