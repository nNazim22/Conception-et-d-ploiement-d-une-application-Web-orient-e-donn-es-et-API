# --- Image légère officielle Node.js ---
FROM node:20-alpine

WORKDIR /app

# Installer les dépendances en premier (cache Docker)
COPY package*.json ./
RUN npm install --omit=dev

# Copier le reste du code
COPY . .

# Port exposé
EXPOSE 8000

# Démarrer le serveur
CMD ["node", "server.js"]
