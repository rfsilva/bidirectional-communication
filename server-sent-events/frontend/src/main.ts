import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { LanguageInterceptor } from './app/interceptors/language.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    // Registra o interceptor de idioma para adicionar ?lang=pt automaticamente
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LanguageInterceptor,
      multi: true
    }
  ]
}).catch(err => console.error(err));