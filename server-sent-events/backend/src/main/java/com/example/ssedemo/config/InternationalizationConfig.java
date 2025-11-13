package com.example.ssedemo.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;
import org.springframework.web.servlet.i18n.SessionLocaleResolver;

import java.util.Locale;

/**
 * Configuração de internacionalização (I18N) para suporte a múltiplos idiomas.
 * 
 * COMPORTAMENTO:
 * - Por padrão, todas as respostas são em INGLÊS
 * - Para outros idiomas, deve ser usado o parâmetro ?lang=pt|es|it
 * - Não considera o header Accept-Language
 * - O frontend deve solicitar explicitamente o idioma desejado
 */
@Configuration
public class InternationalizationConfig implements WebMvcConfigurer {

    /**
     * Configura o MessageSource para carregar mensagens dos arquivos de propriedades.
     */
    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setCacheSeconds(3600); // Cache por 1 hora
        messageSource.setFallbackToSystemLocale(false);
        messageSource.setDefaultLocale(Locale.ENGLISH); // SEMPRE inglês por padrão
        return messageSource;
    }

    /**
     * Configura o LocaleResolver para usar SEMPRE inglês como padrão.
     * Ignora o header Accept-Language e usa apenas o parâmetro ?lang=
     */
    @Bean
    public LocaleResolver localeResolver() {
        SessionLocaleResolver localeResolver = new SessionLocaleResolver();
        localeResolver.setDefaultLocale(Locale.ENGLISH); // SEMPRE inglês por padrão
        return localeResolver;
    }

    /**
     * Interceptor para permitir mudança de idioma APENAS via parâmetro 'lang' na URL.
     * Exemplos: 
     * - /api/data (inglês - padrão)
     * - /api/data?lang=pt (português)
     * - /api/data?lang=es (espanhol)
     * - /api/data?lang=it (italiano)
     */
    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang");
        return interceptor;
    }

    /**
     * Registra o interceptor de mudança de idioma.
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor());
    }
}