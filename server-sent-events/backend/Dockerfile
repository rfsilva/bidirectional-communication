# Multi-stage build para otimizar o tamanho da imagem

# Stage 1: Build da aplicação
FROM maven:3.9.5-eclipse-temurin-21 AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do Maven
COPY pom.xml .
COPY src ./src

# Build da aplicação (pula os testes para acelerar o build)
RUN mvn clean package -DskipTests

# Stage 2: Runtime da aplicação
FROM eclipse-temurin:21-jre-alpine

# Metadados da imagem
LABEL maintainer="SSE Demo Team <demo@example.com>"
LABEL description="SSE Demo Backend - Spring Boot 3 with MySQL and Flyway"
LABEL version="1.0.0"

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Instalar dependências necessárias
RUN apk add --no-cache \
    curl \
    tzdata

# Definir timezone
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Definir diretório de trabalho
WORKDIR /app

# Copiar o JAR da aplicação do stage anterior
COPY --from=builder /app/target/sse-demo-backend-*.jar app.jar

# Alterar proprietário dos arquivos
RUN chown -R appuser:appgroup /app

# Mudar para usuário não-root
USER appuser

# Expor porta da aplicação
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Configurar JVM para container
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC -XX:+UseContainerSupport"

# Comando para executar a aplicação
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=docker -jar app.jar"]