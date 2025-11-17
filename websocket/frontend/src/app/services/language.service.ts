import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Serviço para gerenciar o idioma da aplicação.
 * 
 * CONFIGURAÇÃO ATUAL:
 * - Português (pt) como idioma padrão
 * - Backend responde em inglês por padrão
 * - Frontend sempre solicita português via ?lang=pt
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private readonly API_BASE = 'http://localhost:8080/api';
  
  // Idioma atual do frontend (sempre português inicialmente)
  private currentLanguageSubject = new BehaviorSubject<string>('pt');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  // Idiomas disponíveis
  private readonly AVAILABLE_LANGUAGES = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  constructor(private http: HttpClient) {
    // Carrega idioma salvo ou usa português como padrão
    const savedLanguage = localStorage.getItem('app-language') || 'pt';
    this.setLanguage(savedLanguage);
  }

  /**
   * Obtém o idioma atual
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Define o idioma atual
   */
  setLanguage(language: string): void {
    if (this.isLanguageSupported(language)) {
      this.currentLanguageSubject.next(language);
      localStorage.setItem('app-language', language);
      console.log(`[LanguageService] Language set to: ${language}`);
    } else {
      console.warn(`[LanguageService] Unsupported language: ${language}. Using Portuguese.`);
      this.currentLanguageSubject.next('pt');
    }
  }

  /**
   * Obtém lista de idiomas disponíveis
   */
  getAvailableLanguages() {
    return this.AVAILABLE_LANGUAGES;
  }

  /**
   * Verifica se um idioma é suportado
   */
  isLanguageSupported(language: string): boolean {
    return this.AVAILABLE_LANGUAGES.some(lang => lang.code === language);
  }

  /**
   * Adiciona parâmetro de idioma a uma URL
   */
  addLanguageParam(url: string, language?: string): string {
    const lang = language || this.getCurrentLanguage();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}lang=${lang}`;
  }

  /**
   * Cria HttpParams com o idioma atual
   */
  createParamsWithLanguage(additionalParams?: { [key: string]: string }): HttpParams {
    let params = new HttpParams().set('lang', this.getCurrentLanguage());
    
    if (additionalParams) {
      Object.keys(additionalParams).forEach(key => {
        params = params.set(key, additionalParams[key]);
      });
    }
    
    return params;
  }

  /**
   * Testa a funcionalidade de I18N do backend
   */
  testI18nFunctionality(): Observable<any> {
    const params = this.createParamsWithLanguage();
    return this.http.get(`${this.API_BASE}/i18n/messages`, { params });
  }

  /**
   * Obtém idiomas suportados pelo backend
   */
  getSupportedLocales(): Observable<any> {
    return this.http.get(`${this.API_BASE}/i18n/locales`);
  }

  /**
   * Testa uma mensagem específica
   */
  testSpecificMessage(key: string, args?: string[]): Observable<any> {
    let params = this.createParamsWithLanguage();
    
    if (args && args.length > 0) {
      args.forEach(arg => {
        params = params.append('args', arg);
      });
    }
    
    return this.http.get(`${this.API_BASE}/i18n/message/${key}`, { params });
  }

  /**
   * Demonstra o comportamento do I18N
   */
  demonstrateI18nBehavior(): Observable<any> {
    const params = this.createParamsWithLanguage();
    return this.http.get(`${this.API_BASE}/i18n/demo`, { params });
  }
}