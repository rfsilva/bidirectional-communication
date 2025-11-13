import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor para adicionar automaticamente o parâmetro ?lang=pt 
 * a todas as requisições para o backend.
 * 
 * COMPORTAMENTO:
 * - Todas as chamadas para /api/ terão ?lang=pt adicionado automaticamente
 * - Garante que o frontend sempre receba mensagens em português
 * - Pode ser facilmente alterado para outros idiomas no futuro
 */
@Injectable()
export class LanguageInterceptor implements HttpInterceptor {

  private readonly DEFAULT_LANGUAGE = 'pt'; // Português como padrão para o frontend

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verifica se é uma requisição para a API do backend
    if (req.url.includes('/api/')) {
      
      // Verifica se já não tem o parâmetro lang
      if (!req.url.includes('lang=')) {
        
        // Adiciona o parâmetro lang=pt
        const separator = req.url.includes('?') ? '&' : '?';
        const modifiedUrl = `${req.url}${separator}lang=${this.DEFAULT_LANGUAGE}`;
        
        // Clona a requisição com a nova URL
        const modifiedReq = req.clone({
          url: modifiedUrl
        });

        console.log(`[LanguageInterceptor] Added lang=${this.DEFAULT_LANGUAGE} to: ${req.url}`);
        
        return next.handle(modifiedReq);
      }
    }

    // Se não é uma requisição da API ou já tem o parâmetro lang, passa adiante
    return next.handle(req);
  }
}