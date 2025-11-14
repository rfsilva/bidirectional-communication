import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor de debug para capturar detalhes das requisições
 */
@Injectable()
export class DebugInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Log detalhado da requisição
    console.group('🔍 DEBUG INTERCEPTOR - Requisição');
    console.log('📤 URL:', req.method, req.url);
    console.log('📋 Headers:', this.getHeadersAsObject(req.headers));
    console.log('📦 Body:', req.body);
    console.log('🔗 URL completa:', req.urlWithParams);
    
    // Verificar especificamente o header Authorization
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      console.log('🔐 Authorization Header:', authHeader.substring(0, 50) + '...');
      
      // Decodificar e analisar o token JWT
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        this.analyzeJWTToken(token);
      }
    } else {
      console.warn('⚠️ NENHUM HEADER DE AUTORIZAÇÃO ENCONTRADO!');
    }
    
    console.groupEnd();

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event.type === 4) { // HttpEventType.Response
            console.group('🔍 DEBUG INTERCEPTOR - Resposta');
            console.log('📥 Status:', (event as any).status);
            console.log('📋 Headers:', this.getHeadersAsObject((event as any).headers));
            console.log('📦 Body:', (event as any).body);
            console.groupEnd();
          }
        },
        error: (error: HttpErrorResponse) => {
          console.group('🔍 DEBUG INTERCEPTOR - Erro');
          console.error('❌ Status:', error.status);
          console.error('📋 Headers:', this.getHeadersAsObject(error.headers));
          console.error('📦 Error Body:', error.error);
          console.error('🔗 URL:', error.url);
          console.error('📝 Message:', error.message);
          
          // Análise específica para erro 401
          if (error.status === 401) {
            console.error('🔒 ANÁLISE DO ERRO 401:');
            const authHeader = req.headers.get('Authorization');
            if (authHeader) {
              console.error('   - Token foi enviado:', authHeader.substring(0, 50) + '...');
              const token = authHeader.substring(7);
              console.error('   - Token decodificado:');
              this.analyzeJWTToken(token);
            } else {
              console.error('   - ❌ NENHUM TOKEN FOI ENVIADO!');
            }
            
            // Verificar localStorage
            const localToken = localStorage.getItem('sse-demo-token');
            console.error('   - Token no localStorage:', localToken ? 'Presente' : 'Ausente');
            
            if (localToken && authHeader) {
              console.error('   - Tokens são iguais:', localToken === authHeader.substring(7));
            }
          }
          
          console.groupEnd();
        }
      })
    );
  }

  private getHeadersAsObject(headers: any): any {
    const headersObj: any = {};
    if (headers && headers.keys) {
      headers.keys().forEach((key: string) => {
        headersObj[key] = headers.get(key);
      });
    }
    return headersObj;
  }

  private analyzeJWTToken(token: string): void {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('   - ❌ Token inválido: não possui 3 partes');
        return;
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;
      
      console.log('   - 📋 Header:', header);
      console.log('   - 📦 Payload:', payload);
      console.log('   - ⏰ Emitido em:', payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'N/A');
      console.log('   - ⏰ Expira em:', payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A');
      console.log('   - ⏱️ Tempo restante:', payload.exp ? Math.max(0, payload.exp - now) + ' segundos' : 'N/A');
      console.log('   - 🔍 Status:', isExpired ? '❌ EXPIRADO' : '✅ Válido');
      
      if (isExpired) {
        console.error('   - 🚨 TOKEN EXPIRADO! Este é provavelmente o motivo do erro 401');
      }
      
    } catch (error) {
      console.error('   - ❌ Erro ao decodificar token:', error);
    }
  }
}