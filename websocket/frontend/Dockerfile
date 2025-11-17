# Multi-stage build para Angular

# Stage 1: Build da aplicação Angular
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação para produção
RUN npm run build --prod

# Stage 2: Servir com Nginx
FROM nginx:alpine

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos buildados do Angular
COPY --from=builder /app/dist/sse-demo-frontend /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]