import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { DataService } from '../../services/data.service';
import { NotificationService } from '../../services/notification.service';

/**
 * Componente para testar a funcionalidade de I18N.
 * Demonstra como o frontend sempre solicita mensagens em português.
 */
@Component({
  selector: 'app-language-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-test-container">
      <h2>🌍 Teste de Internacionalização</h2>
      
      <div class="info-section">
        <h3>📋 Configuração Atual</h3>
        <div class="config-info">
          <p><strong>Backend padrão:</strong> Inglês</p>
          <p><strong>Frontend solicita:</strong> Português (via ?lang=pt)</p>
          <p><strong>Idioma atual:</strong> {{ currentLanguage }}</p>
          <p><strong>Interceptor ativo:</strong> ✅ Adicionando ?lang=pt automaticamente</p>
        </div>
      </div>

      <div class="test-section">
        <h3>🧪 Testes Disponíveis</h3>
        
        <div class="test-buttons">
          <button (click)="testHealthEndpoint()" class="test-btn">
            Testar Health (deve vir em português)
          </button>
          
          <button (click)="testI18nMessages()" class="test-btn">
            Testar Mensagens I18N
          </button>
          
          <button (click)="testDataCreation()" class="test-btn">
            Testar Criação de Dados
          </button>
          
          <button (click)="testNotification()" class="test-btn">
            Testar Notificação
          </button>
          
          <button (click)="changeLanguage('en')" class="test-btn secondary">
            Mudar para Inglês (temporário)
          </button>
          
          <button (click)="changeLanguage('pt')" class="test-btn">
            Voltar para Português
          </button>
        </div>
      </div>

      <div class="results-section" *ngIf="testResults.length > 0">
        <h3>📊 Resultados dos Testes</h3>
        <div class="results-list">
          <div *ngFor="let result of testResults" 
               class="result-item" 
               [ngClass]="{'success': result.success, 'error': !result.success}">
            <div class="result-header">
              <span class="result-title">{{ result.test }}</span>
              <span class="result-status">{{ result.success ? '✅' : '❌' }}</span>
            </div>
            <div class="result-details">
              <p><strong>URL:</strong> {{ result.url }}</p>
              <p><strong>Idioma detectado:</strong> {{ result.detectedLanguage }}</p>
              <p><strong>Mensagem:</strong> {{ result.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="available-languages">
        <h3>🗣️ Idiomas Disponíveis</h3>
        <div class="language-list">
          <div *ngFor="let lang of availableLanguages" 
               class="language-item"
               [ngClass]="{'active': lang.code === currentLanguage}">
            <span class="flag">{{ lang.flag }}</span>
            <span class="name">{{ lang.name }}</span>
            <span class="code">({{ lang.code }})</span>
            <button (click)="changeLanguage(lang.code)" class="change-btn">
              Usar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .language-test-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .info-section, .test-section, .results-section, .available-languages {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .config-info p {
      margin: 8px 0;
      padding: 8px;
      background: white;
      border-radius: 4px;
    }

    .test-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .test-btn {
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      background: #007bff;
      color: white;
      cursor: pointer;
      transition: background 0.3s;
    }

    .test-btn:hover {
      background: #0056b3;
    }

    .test-btn.secondary {
      background: #6c757d;
    }

    .test-btn.secondary:hover {
      background: #545b62;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .result-item {
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid;
    }

    .result-item.success {
      background: #d4edda;
      border-left-color: #28a745;
    }

    .result-item.error {
      background: #f8d7da;
      border-left-color: #dc3545;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .result-title {
      font-weight: bold;
    }

    .result-details p {
      margin: 5px 0;
      font-size: 0.9em;
    }

    .language-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .language-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: white;
      border-radius: 5px;
      border: 2px solid transparent;
    }

    .language-item.active {
      border-color: #007bff;
      background: #e3f2fd;
    }

    .flag {
      font-size: 1.5em;
    }

    .name {
      font-weight: bold;
      flex: 1;
    }

    .code {
      color: #666;
      font-family: monospace;
    }

    .change-btn {
      padding: 5px 10px;
      border: 1px solid #007bff;
      background: white;
      color: #007bff;
      border-radius: 3px;
      cursor: pointer;
    }

    .change-btn:hover {
      background: #007bff;
      color: white;
    }
  `]
})
export class LanguageTestComponent implements OnInit {

  currentLanguage: string = 'pt';
  availableLanguages: any[] = [];
  testResults: any[] = [];

  constructor(
    private languageService: LanguageService,
    private dataService: DataService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.availableLanguages = this.languageService.getAvailableLanguages();
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  async testHealthEndpoint() {
    try {
      // O interceptor automaticamente adicionará ?lang=pt
      const response = await fetch('http://localhost:8080/api/health');
      const data = await response.json();
      
      this.addTestResult({
        test: 'Health Endpoint',
        url: 'http://localhost:8080/api/health (+ ?lang=pt via interceptor)',
        success: true,
        detectedLanguage: data.locale || 'unknown',
        message: data.message || 'No message'
      });
    } catch (error) {
      this.addTestResult({
        test: 'Health Endpoint',
        url: 'http://localhost:8080/api/health',
        success: false,
        detectedLanguage: 'error',
        message: 'Erro na requisição: ' + error
      });
    }
  }

  testI18nMessages() {
    this.languageService.testI18nFunctionality().subscribe({
      next: (response) => {
        this.addTestResult({
          test: 'I18N Messages',
          url: 'http://localhost:8080/api/i18n/messages?lang=' + this.currentLanguage,
          success: true,
          detectedLanguage: response.currentLocale,
          message: response.messages?.welcome || 'No welcome message'
        });
      },
      error: (error) => {
        this.addTestResult({
          test: 'I18N Messages',
          url: 'http://localhost:8080/api/i18n/messages',
          success: false,
          detectedLanguage: 'error',
          message: 'Erro: ' + error.message
        });
      }
    });
  }

  testDataCreation() {
    const testData = {
      name: 'Teste I18N',
      value: 'Testando mensagens em português'
    };

    this.dataService.createData(testData).subscribe({
      next: (response) => {
        this.addTestResult({
          test: 'Data Creation',
          url: 'http://localhost:8080/api/data (+ ?lang=pt via interceptor)',
          success: true,
          detectedLanguage: this.currentLanguage,
          message: 'Dados criados com sucesso: ' + response.name
        });
      },
      error: (error) => {
        this.addTestResult({
          test: 'Data Creation',
          url: 'http://localhost:8080/api/data',
          success: false,
          detectedLanguage: 'error',
          message: 'Erro: ' + error.message
        });
      }
    });
  }

  testNotification() {
    this.notificationService.sendTestNotification('Teste de notificação em português').subscribe({
      next: (response) => {
        this.addTestResult({
          test: 'Test Notification',
          url: 'http://localhost:8080/api/notifications/test (+ ?lang=pt via interceptor)',
          success: true,
          detectedLanguage: this.currentLanguage,
          message: response.message || 'Notificação enviada'
        });
      },
      error: (error) => {
        this.addTestResult({
          test: 'Test Notification',
          url: 'http://localhost:8080/api/notifications/test',
          success: false,
          detectedLanguage: 'error',
          message: 'Erro: ' + error.message
        });
      }
    });
  }

  changeLanguage(language: string) {
    this.languageService.setLanguage(language);
    this.addTestResult({
      test: 'Language Change',
      url: 'Local change',
      success: true,
      detectedLanguage: language,
      message: `Idioma alterado para: ${language}. Próximas requisições usarão ?lang=${language}`
    });
  }

  private addTestResult(result: any) {
    this.testResults.unshift({
      ...result,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Manter apenas os últimos 10 resultados
    if (this.testResults.length > 10) {
      this.testResults = this.testResults.slice(0, 10);
    }
  }
}