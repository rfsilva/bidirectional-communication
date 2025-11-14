import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Serviço de debug para testar autenticação em todas as requisições
 */
@Injectable({
  providedIn: 'root'
})
export class AuthDebugService {
  private readonly API_BASE = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Testa se o token está sendo enviado corretamente
   */
  testTokenInRequests(): void {
    console.log('🧪 AuthDebug: Iniciando testes de token...');
    
    // Teste 1: Verificar estado atual
    this.logCurrentAuthState();
    
    // Teste 2: Verificar expiração do token
    this.checkTokenExpiration();
    
    // Teste 3: Requisição manual com token
    this.testManualTokenRequest();
    
    // Teste 4: Requisição via interceptor
    this.testInterceptorRequest();
  }

  private logCurrentAuthState(): void {
    console.log('🔍 AuthDebug: Estado atual da autenticação:');
    console.log('  - isAuthenticated():', this.authService.isAuthenticated());
    console.log('  - getToken():', this.authService.getToken() ? 'Token presente' : 'Token ausente');
    console.log('  - getCurrentUser():', this.authService.getCurrentUser()?.username || 'Nenhum usuário');
    
    const token = this.authService.getToken();
    if (token) {
      console.log('  - Token preview:', token.substring(0, 50) + '...');
    }
  }

  private checkTokenExpiration(): void {
    console.log('🔍 AuthDebug: Verificando expiração do token...');
    
    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ AuthDebug: Nenhum token para verificar expiração');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ AuthDebug: Token inválido - não possui 3 partes');
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      console.log('📋 AuthDebug: Informações do token:');
      console.log('  - Usuário:', payload.sub || payload.username || 'N/A');
      console.log('  - Emitido em:', payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'N/A');
      console.log('  - Expira em:', payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A');
      console.log('  - Tempo atual:', new Date().toLocaleString());
      
      if (payload.exp) {
        const timeLeft = payload.exp - now;
        const isExpired = timeLeft <= 0;
        
        console.log('  - Tempo restante:', Math.max(0, timeLeft), 'segundos');
        console.log('  - Status:', isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO');
        
        if (isExpired) {
          console.error('🚨 AuthDebug: TOKEN EXPIRADO! Este é o motivo do erro 401');
          console.error('   Solução: Faça logout e login novamente');
          console.error('   Ou execute: localStorage.clear(); location.reload();');
        }
      } else {
        console.warn('⚠️ AuthDebug: Token não possui campo de expiração');
      }
      
    } catch (error) {
      console.error('❌ AuthDebug: Erro ao decodificar token:', error);
    }
  }

  private testManualTokenRequest(): void {
    console.log('🧪 AuthDebug: Testando requisição manual com token...');
    
    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ AuthDebug: Não há token para teste manual');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get(`${this.API_BASE}/data`, { headers }).pipe(
      tap({
        next: (data) => {
          console.log('✅ AuthDebug: Requisição manual com token funcionou:', Array.isArray(data) ? `${data.length} itens` : 'dados recebidos');
        },
        error: (error) => {
          console.error('❌ AuthDebug: Requisição manual com token falhou:', error.status, error.message);
          if (error.status === 401) {
            console.error('🔒 AuthDebug: Erro 401 na requisição manual - token rejeitado pelo servidor');
            this.analyzeServerResponse(error);
          }
        }
      })
    ).subscribe();
  }

  private testInterceptorRequest(): void {
    console.log('🧪 AuthDebug: Testando requisição via interceptor...');
    
    // Esta requisição deve passar pelo interceptor
    this.http.get(`${this.API_BASE}/data`).pipe(
      tap({
        next: (data) => {
          console.log('✅ AuthDebug: Requisição via interceptor funcionou:', Array.isArray(data) ? `${data.length} itens` : 'dados recebidos');
        },
        error: (error) => {
          console.error('❌ AuthDebug: Requisição via interceptor falhou:', error.status, error.message);
          
          if (error.status === 401) {
            console.error('🔒 AuthDebug: Erro 401 - Token não foi enviado ou é inválido');
            this.debugTokenIssue();
            this.analyzeServerResponse(error);
          }
        }
      })
    ).subscribe();
  }

  private analyzeServerResponse(error: any): void {
    console.log('🔍 AuthDebug: Analisando resposta do servidor...');
    
    if (error.error) {
      console.log('  - Erro do servidor:', error.error);
      
      if (error.error.message) {
        console.log('  - Mensagem:', error.error.message);
        
        if (error.error.message.includes('expirado')) {
          console.error('🚨 AuthDebug: Servidor confirma que o token está EXPIRADO');
        } else if (error.error.message.includes('inválido')) {
          console.error('🚨 AuthDebug: Servidor diz que o token é INVÁLIDO');
        }
      }
      
      if (error.error.timestamp) {
        console.log('  - Timestamp do erro:', error.error.timestamp);
      }
    }
  }

  private debugTokenIssue(): void {
    console.log('🔍 AuthDebug: Investigando problema com token...');
    
    const token = this.authService.getToken();
    const isAuth = this.authService.isAuthenticated();
    const localToken = localStorage.getItem('sse-demo-token');
    
    console.log('  - Token no localStorage:', localToken ? 'Presente' : 'Ausente');
    console.log('  - Token no AuthService:', token ? 'Presente' : 'Ausente');
    console.log('  - isAuthenticated():', isAuth);
    console.log('  - Tokens são iguais:', localToken === token);
    
    if (token) {
      // Verificar se o token é válido no servidor
      this.authService.validateToken().subscribe({
        next: (isValid) => {
          console.log('  - Token válido no servidor:', isValid);
          if (!isValid) {
            console.error('🚨 AuthDebug: Servidor rejeita o token - faça novo login');
          }
        },
        error: (error) => {
          console.error('  - Erro ao validar token:', error);
        }
      });
    }
  }

  /**
   * Força um novo login para obter token fresco
   */
  forceTokenRefresh(): void {
    console.log('🔄 AuthDebug: Forçando refresh do token...');
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('❌ AuthDebug: Nenhum usuário atual para refresh');
      return;
    }
    
    console.log('⚠️ AuthDebug: Para refresh do token, você precisa fazer logout e login novamente');
    console.log('   Execute no console: localStorage.clear(); location.reload();');
  }

  /**
   * Limpa dados de autenticação e força novo login
   */
  clearAuthAndReload(): void {
    console.log('🔄 AuthDebug: Limpando dados de autenticação...');
    
    localStorage.removeItem('sse-demo-token');
    localStorage.removeItem('sse-demo-user');
    
    console.log('✅ AuthDebug: Dados limpos. Recarregando página...');
    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  /**
   * Testa todos os endpoints que requerem autenticação
   */
  testAllProtectedEndpoints(): void {
    console.log('🧪 AuthDebug: Testando todos os endpoints protegidos...');
    
    const endpoints = [
      { url: '/data', name: 'Todos os dados' },
      { url: '/data/external', name: 'Dados externos' },
      { url: '/data/internal', name: 'Dados internos' },
      { url: '/data/stats', name: 'Estatísticas' },
      { url: '/users', name: 'Lista de usuários' },
      { url: '/users/stats', name: 'Estatísticas de usuários' },
      { url: '/notifications/status', name: 'Status SSE' },
      { url: '/profile', name: 'Perfil do usuário' }
    ];

    endpoints.forEach(endpoint => {
      console.log(`🔍 AuthDebug: Testando ${endpoint.name} (${endpoint.url})...`);
      
      this.http.get(`${this.API_BASE}${endpoint.url}`).pipe(
        tap({
          next: (data) => {
            console.log(`✅ AuthDebug: ${endpoint.name} - Sucesso`);
          },
          error: (error) => {
            console.error(`❌ AuthDebug: ${endpoint.name} - Erro ${error.status}: ${error.message}`);
          }
        })
      ).subscribe();
    });
  }

  /**
   * Monitora requisições HTTP em tempo real
   */
  startRequestMonitoring(): void {
    console.log('📡 AuthDebug: Monitoramento de requisições iniciado');
    console.log('   Observe os logs do DebugInterceptor para ver detalhes das requisições');
    console.log('   Observe os logs do JwtInterceptor para ver se o token está sendo adicionado');
  }

  /**
   * Executa diagnóstico completo
   */
  runFullDiagnostic(): void {
    console.group('🔍 DIAGNÓSTICO COMPLETO DE AUTENTICAÇÃO');
    
    console.log('1. Verificando estado da autenticação...');
    this.logCurrentAuthState();
    
    console.log('2. Verificando expiração do token...');
    this.checkTokenExpiration();
    
    console.log('3. Testando requisições...');
    this.testTokenInRequests();
    
    console.groupEnd();
    
    console.log('📋 AuthDebug: Diagnóstico completo executado. Verifique os logs acima.');
  }
}