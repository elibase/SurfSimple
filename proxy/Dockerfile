FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Cloud Run sets PORT to 8080 automatically
ENV PORT=8080

# Run as non-root
USER node

CMD ["node", "index.js"]
