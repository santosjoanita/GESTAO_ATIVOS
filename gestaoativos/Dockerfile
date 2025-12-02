
# Usa uma imagem Node.js para instalar dependências e compilar o código.
FROM node:20-alpine AS builder


WORKDIR /app

# Copia o package.json e o package-lock.json para instalar dependências
COPY package.json ./
COPY package-lock.json ./

# Instala as dependências (incluindo as de desenvolvimento)
RUN npm install


COPY . .


RUN npm run build

# --- STAGE 2: PRODUCTION/SERVING ---

FROM nginx:alpine


COPY --from=builder /app/dist /usr/share/nginx/html

# A porta padrão do Nginx é a 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]