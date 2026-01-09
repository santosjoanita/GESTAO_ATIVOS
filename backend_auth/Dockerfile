FROM node:20-alpine

# Instalar ferramentas de build (CRUCIAL para bcrypt)
RUN apk update && apk add --no-cache python3 g++ make

WORKDIR /usr/src/app

# Copiar dependências, instalar, e só depois copiar o código
COPY package*.json ./
RUN npm install --unsafe-perm

# Copiar o restante do código
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]