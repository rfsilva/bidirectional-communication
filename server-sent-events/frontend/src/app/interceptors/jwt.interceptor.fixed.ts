import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor corrigido para adicionar token JWT automaticamente às requisições
 * e tratar erros de autenticação.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔐 JwtInterceptor: Processando requisição para:', req.url);
    
    // Verificar se deve adicionar token
    if (this.shouldAddToken(req.url)) {
      const token = this.authService.getToken();
      
      if (token) {
        console.log('🔐 JwtInterceptor: Adicionando token à requisição');
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        console.warn('🔐 JwtInterceptor: Token não encontrado para requisição protegida:', req.url);
      }
    } else {
      console.log('🔐 JwtInterceptor: Requisição pública, não adicionando token');
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('🔐 JwtInterceptor: Erro na requisição:', error.status, error.url);
        
        // Tratar erros de autenticação
        if (error.status === 401) {
          console.warn('🔒 JwtInterceptor: Token expirado ou inválido (401), fazendo logout');
          
          // Só fazer logout se não for uma tentativa de login
          if (!error.url?.includes('/auth/login')) {
            this.authService.forceLogout();
            this.router.navigate(['/login'], { 
              queryParams: { 
                returnUrl: this.router.url,
                reason: 'session_expired' 
              } 
            });
          }
        } else if (error.status === 403) {
          console.warn('🚫 JwtInterceptor: Acesso negado (403)');
          // Não fazer logout, apenas mostrar erro
        } else if (error.status === 0) {
          console.error('🌐 JwtInterceptor: Erro de conectividade (0) - servidor pode estar offline');
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica se deve adicionar token à requisição.
   */
  private shouldAddToken(url: string): boolean {
    // Não adicionar token para endpoints públicos
    const publicEndpoints = [
      '/auth/login',
      '/health',
      '/i18n/locales',
      '/i18n/messages'
    ];

    // Verificar se é um endpoint público
    const isPublic = publicEndpoints.some(endpoint => url.includes(endpoint));
    
    if (isPublic) {
      return false;
    }

    // Adicionar token para todas as outras requisições da API
    return url.includes('/api/');
  }
}