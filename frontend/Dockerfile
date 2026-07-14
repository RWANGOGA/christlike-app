FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Run in development mode for hot-reloading
CMD ["npm", "run", "dev"]