package com.example.websocketdemo.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuração de segurança da aplicação.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public DaoAuthenticationProvider authenticationProvider(@Lazy UserDetailsService userDetailsService) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, 
                                         JwtAuthenticationFilter jwtAuthenticationFilter,
                                         DaoAuthenticationProvider authenticationProvider) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Endpoints públicos
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                
                // I18N - público
                .requestMatchers("/api/i18n/**").permitAll()
                
                // Endpoints de usuários - apenas ADMIN
                .requestMatchers(HttpMethod.GET, "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")
                
                // Perfil próprio - todos podem ver/editar
                .requestMatchers(HttpMethod.GET, "/api/profile").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/profile").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/profile/password").authenticated()
                
                // Dados do sistema - ADMIN e EDITOR podem tudo, VIEWER só leitura
                .requestMatchers(HttpMethod.GET, "/api/data/**").hasAnyRole("ADMIN", "EDITOR", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/data/**").hasAnyRole("ADMIN", "EDITOR")
                .requestMatchers(HttpMethod.PUT, "/api/data/**").hasAnyRole("ADMIN", "EDITOR")
                .requestMatchers(HttpMethod.DELETE, "/api/data/**").hasAnyRole("ADMIN", "EDITOR")
                
                // Mensagens - todos autenticados podem acessar (controle de acesso no service)
                .requestMatchers("/api/messages/**").authenticated()
                
                // SSE - todos autenticados podem ver status, ADMIN/EDITOR podem gerenciar
                .requestMatchers(HttpMethod.GET, "/api/sse/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/sse/**").hasAnyRole("ADMIN", "EDITOR")
                
                // Notificações - todos autenticados
                .requestMatchers("/api/notifications/**").authenticated()
                
                // Qualquer outra requisição precisa estar autenticada
                .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider);
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
