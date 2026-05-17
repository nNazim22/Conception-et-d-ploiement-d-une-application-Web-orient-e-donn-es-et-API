# --- ÉTAPE 1 : La compilation (Build) ---
FROM node:20 AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- ÉTAPE 2 : Le serveur Web (Production) ---
FROM nginx:alpine

# Notre config nginx personnalisée (proxy /api/ vers le backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Code compilé de l'étape 1
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
