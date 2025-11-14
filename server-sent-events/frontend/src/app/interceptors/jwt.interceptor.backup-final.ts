import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor JWT corrigido que aguarda a inicialização completa da autenticação
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
      '/auth/logout',
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

    // Para endpoints da API, aguardar inicialização e adicionar token
    if (req.url.includes('/api/')) {
      console.log('🔐 JwtInterceptor: Endpoint da API detectado, aguardando inicialização...');
      
      // Aguardar que a inicialização esteja completa
      return this.authService.waitForInitialization().pipe(
        take(1),
        switchMap(() => {
          const token = this.authService.getToken();
          
          if (token) {
            console.log('🔐 JwtInterceptor: Token encontrado, adicionando à requisição');
            console.log('🔍 JwtInterceptor: Token preview:', token.substring(0, 30) + '...');
            
            const authenticatedReq = req.clone({
              setHeaders: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('🔍 JwtInterceptor: Headers adicionados:', authenticatedReq.headers.keys());
            
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
            console.error('🔒 JwtInterceptor: ERRO CRÍTICO - Token não encontrado após inicialização!');
            console.error('🔍 JwtInterceptor: URL da requisição:', req.url);
            console.error('🔍 JwtInterceptor: AuthService.isAuthenticated():', this.authService.isAuthenticated());
            
            // Se não há token, mas a requisição é para API protegida, redirecionar para login
            console.error('🔒 JwtInterceptor: Redirecionando para login - sem token para endpoint protegido');
            this.authService.forceLogout();
            this.router.navigate(['/login']);
            
            // Ainda assim, tentar a requisição (vai dar 401, mas é esperado)
            return next.handle(req).pipe(
              catchError((error: HttpErrorResponse) => {
                console.error('🔒 JwtInterceptor: Erro esperado (sem token):', error.status);
                return throwError(() => error);
              })
            );
          }
        })
      );
    }

    // Se não é uma requisição da API, passar adiante
    console.log('🔐 JwtInterceptor: Não é requisição da API, passando adiante');
    return next.handle(req);
  }
}