FROM node:20-alpine

RUN apk update && apk add --no-cache python3 g++ make

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --unsafe-perm

COPY . .

EXPOSE 3001
CMD ["node", "index.js"]