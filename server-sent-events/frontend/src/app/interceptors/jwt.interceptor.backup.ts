import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor para adicionar token JWT automaticamente às requisições
 * e tratar erros de autenticação.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Adicionar token JWT se usuário estiver autenticado
    const token = this.authService.getToken();
    
    if (token && this.shouldAddToken(req.url)) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Tratar erros de autenticação
        if (error.status === 401) {
          console.warn('🔒 Token expirado ou inválido (401), fazendo logout');
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          console.warn('🚫 Acesso negado (403)');
          // Não fazer logout, apenas mostrar erro
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica se deve adicionar token à requisição.
   */
  private shouldAddToken(url: string): boolean {
    // Não adicionar token para endpoints de login
    const publicEndpoints = [
      '/auth/login',
      '/auth/validate',
      '/health',
      '/i18n/'
    ];

    return !publicEndpoints.some(endpoint => url.includes(endpoint));
  }
}