import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, switchMap, retryWhen, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor JWT final e robusto para adicionar token automaticamente às requisições
 * e tratar erros de autenticação com retry inteligente.
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
      return this.addTokenAndProceed(req, next);
    } else {
      console.log('🔐 JwtInterceptor: Requisição pública, não adicionando token');
      return next.handle(req);
    }
  }

  private addTokenAndProceed(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      console.log('🔐 JwtInterceptor: Token encontrado, adicionando à requisição');
      const authenticatedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return this.handleRequest(authenticatedReq, next);
    } else {
      console.warn('🔐 JwtInterceptor: Token não encontrado para requisição protegida');
      
      // Se não há token mas o usuário deveria estar autenticado, aguardar um pouco
      if (this.authService.isAuthenticated()) {
        console.log('🔐 JwtInterceptor: Usuário autenticado mas token não disponível, aguardando...');
        
        return timer(100).pipe(
          switchMap(() => {
            const retryToken = this.authService.getToken();
            if (retryToken) {
              console.log('🔐 JwtInterceptor: Token obtido após aguardar');
              const authenticatedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${retryToken}`
                }
              });
              return this.handleRequest(authenticatedReq, next);
            } else {
              console.error('🔐 JwtInterceptor: Token ainda não disponível após aguardar');
              return this.handleRequest(req, next);
            }
          })
        );
      } else {
        return this.handleRequest(req, next);
      }
    }
  }

  private handleRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retryWhen(errors => 
        errors.pipe(
          switchMap((error: HttpErrorResponse, index) => {
            // Retry apenas para erros 401 e apenas uma vez
            if (error.status === 401 && index === 0 && !req.url.includes('/auth/login')) {
              console.warn('🔐 JwtInterceptor: Erro 401, tentando novamente após aguardar token...');
              
              return timer(200).pipe(
                switchMap(() => {
                  const freshToken = this.authService.getToken();
                  if (freshToken && freshToken !== req.headers.get('Authorization')?.replace('Bearer ', '')) {
                    console.log('🔐 JwtInterceptor: Novo token disponível para retry');
                    return timer(0); // Permite retry
                  } else {
                    console.error('🔐 JwtInterceptor: Nenhum token novo disponível');
                    return throwError(() => error); // Não faz retry
                  }
                })
              );
            } else {
              return throwError(() => error); // Não faz retry
            }
          }),
          take(1) // Apenas um retry
        )
      ),
      catchError((error: HttpErrorResponse) => {
        console.error('🔐 JwtInterceptor: Erro na requisição:', error.status, error.url);
        
        // Tratar erros de autenticação
        if (error.status === 401) {
          console.warn('🔒 JwtInterceptor: Token expirado ou inválido (401)');
          
          // Só fazer logout se não for uma tentativa de login
          if (!error.url?.includes('/auth/login')) {
            console.warn('🔒 JwtInterceptor: Fazendo logout devido a 401');
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