import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor JWT simplificado e direto para garantir que o token seja sempre enviado.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔐 JwtInterceptor: Interceptando requisição:', req.method, req.url);
    
    // Lista de endpoints que NÃO precisam de token
    const publicEndpoints = [
      '/auth/login',
      '/health',
      '/i18n/locales',
      '/i18n/messages',
      '/i18n/demo'
    ];

    // Verificar se é um endpoint público
    const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
    
    if (isPublicEndpoint) {
      console.log('🔐 JwtInterceptor: Endpoint público, não adicionando token');
      return next.handle(req);
    }

    // Para todos os outros endpoints da API, adicionar token
    if (req.url.includes('/api/')) {
      const token = this.getTokenFromStorage();
      
      if (token) {
        console.log('🔐 JwtInterceptor: Adicionando token à requisição');
        console.log('🔍 JwtInterceptor: Token preview:', token.substring(0, 30) + '...');
        
        const authenticatedReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 JwtInterceptor: Headers da requisição:', authenticatedReq.headers.keys());
        
        return next.handle(authenticatedReq).pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('❌ JwtInterceptor: Erro na requisição autenticada:', {
              status: error.status,
              url: error.url,
              message: error.message
            });
            
            if (error.status === 401) {
              console.error('🔒 JwtInterceptor: Erro 401 - Token pode estar expirado');
              console.error('🔍 JwtInterceptor: Token usado:', token.substring(0, 30) + '...');
              
              // Verificar se o token ainda está no localStorage
              const currentToken = this.getTokenFromStorage();
              console.error('🔍 JwtInterceptor: Token atual no localStorage:', currentToken ? 'Presente' : 'Ausente');
              
              // Fazer logout apenas se não for login
              if (!error.url?.includes('/auth/login')) {
                console.error('🔒 JwtInterceptor: Fazendo logout devido a 401');
                this.authService.forceLogout();
                this.router.navigate(['/login']);
              }
            }
            
            return throwError(() => error);
          })
        );
      } else {
        console.error('🔒 JwtInterceptor: ERRO CRÍTICO - Token não encontrado para endpoint protegido!');
        console.error('🔍 JwtInterceptor: URL da requisição:', req.url);
        console.error('🔍 JwtInterceptor: AuthService.isAuthenticated():', this.authService.isAuthenticated());
        console.error('🔍 JwtInterceptor: Token no localStorage:', this.getTokenFromStorage() ? 'Presente' : 'Ausente');
        
        // Tentar obter token do AuthService
        const authServiceToken = this.authService.getToken();
        console.error('🔍 JwtInterceptor: Token no AuthService:', authServiceToken ? 'Presente' : 'Ausente');
        
        return next.handle(req).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              console.error('🔒 JwtInterceptor: Erro 401 esperado (sem token)');
              this.authService.forceLogout();
              this.router.navigate(['/login']);
            }
            return throwError(() => error);
          })
        );
      }
    }

    // Se não é uma requisição da API, passar adiante
    console.log('🔐 JwtInterceptor: Não é requisição da API, passando adiante');
    return next.handle(req);
  }

  /**
   * Obtém token diretamente do localStorage para evitar problemas de sincronização
   */
  private getTokenFromStorage(): string | null {
    const token = localStorage.getItem('sse-demo-token');
    return token;
  }
}