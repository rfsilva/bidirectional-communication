import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';

// Interceptor JWT como função (forma que estava funcionando)
export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Lista de endpoints que não precisam de token
  const publicEndpoints = [
    '/auth/login',
    '/auth/logout', 
    '/health',
    '/i18n/'
  ];

  // Verificar se é um endpoint público
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (isPublicEndpoint) {
    return next(req);
  }

  // Para endpoints da API, adicionar token
  if (req.url.includes('/api/')) {
    const token = localStorage.getItem('sse-demo-token');
    
    if (token) {
      const authenticatedReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return next(authenticatedReq);
    } else {
      // Se não há token, passar sem token (vai dar 401 e o AuthService vai tratar)
      return next(req);
    }
  }

  return next(req);
}

// Interceptor de idioma como função
export function languageInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Adicionar parâmetro de idioma se não estiver presente
  if (!req.params.has('lang')) {
    const modifiedReq = req.clone({
      setParams: {
        lang: 'pt'
      }
    });
    return next(modifiedReq);
  }
  
  return next(req);
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([languageInterceptor, jwtInterceptor])
    ),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));