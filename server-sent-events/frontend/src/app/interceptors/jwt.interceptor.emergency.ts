import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor JWT de emergência - versão mais simples e direta
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🚨 EMERGENCY JWT INTERCEPTOR: Interceptando:', req.method, req.url);
    
    // Lista de endpoints que NÃO precisam de token
    const publicEndpoints = [
      '/auth/login',
      '/auth/logout', 
      '/health',
      '/i18n/'
    ];

    // Verificar se é um endpoint público
    const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
    
    if (isPublicEndpoint) {
      console.log('🚨 EMERGENCY: Endpoint público, não adicionando token');
      return next.handle(req);
    }

    // Para todos os outros endpoints, SEMPRE adicionar token
    if (req.url.includes('/api/')) {
      const token = localStorage.getItem('sse-demo-token');
      
      console.log('🚨 EMERGENCY: Endpoint da API detectado');
      console.log('🚨 EMERGENCY: Token no localStorage:', token ? 'PRESENTE' : 'AUSENTE');
      
      if (token) {
        console.log('🚨 EMERGENCY: ADICIONANDO TOKEN À REQUISIÇÃO');
        console.log('🚨 EMERGENCY: Token preview:', token.substring(0, 30) + '...');
        
        const authenticatedReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🚨 EMERGENCY: Headers da requisição:', authenticatedReq.headers.keys());
        console.log('🚨 EMERGENCY: Authorization header:', authenticatedReq.headers.get('Authorization')?.substring(0, 30) + '...');
        
        return next.handle(authenticatedReq).pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('🚨 EMERGENCY: ERRO NA REQUISIÇÃO AUTENTICADA:', {
              status: error.status,
              url: error.url,
              message: error.message
            });
            
            if (error.status === 401) {
              console.error('🚨 EMERGENCY: ERRO 401 - MAS O TOKEN FOI ENVIADO!');
              console.error('🚨 EMERGENCY: Token enviado:', token.substring(0, 30) + '...');
              console.error('🚨 EMERGENCY: Resposta do servidor:', error.error);
            }
            
            return throwError(() => error);
          })
        );
      } else {
        console.error('🚨 EMERGENCY: ERRO CRÍTICO - NENHUM TOKEN ENCONTRADO!');
        console.error('🚨 EMERGENCY: URL da requisição:', req.url);
        console.error('🚨 EMERGENCY: Redirecionando para login');
        
        this.router.navigate(['/login']);
        return throwError(() => new Error('No token found'));
      }
    }

    // Se não é uma requisição da API, passar adiante
    console.log('🚨 EMERGENCY: Não é requisição da API, passando adiante');
    return next.handle(req);
  }
}