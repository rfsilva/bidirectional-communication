package com.example.ssedemo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SSE Demo API")
                        .description("API para demonstração de Server-Sent Events com Spring Boot 3 e Angular 18")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("SSE Demo Team")
                                .email("demo@example.com")
                                .url("https://github.com/example/sse-demo"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Servidor de Desenvolvimento"),
                        new Server()
                                .url("https://api.example.com")
                                .description("Servidor de Produção")));
    }
}