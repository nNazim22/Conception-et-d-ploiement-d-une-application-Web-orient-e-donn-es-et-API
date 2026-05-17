# Projet : Catalogue de Films (Architecture Microservices K8s)

**Module :** Cloud et réseaux virtuels (2025-2026)  
**Formation :** Master 1 Informatique - Parcours RES (Sorbonne Université)  
**Équipe :** 
* ABOULHANA Soufian
* HOUMEL Nazim
* BENDOUHA Abderrazzak

---

## Présentation du Projet
Ce projet consiste en la conception et le déploiement d'une application web orientée données permettant la gestion d'un catalogue de films. L'application interroge l'API externe TMDB et repose sur une architecture cloud-native distribuée, conteneurisée avec **Docker** et orchestrée par **Kubernetes**.

L'objectif principal est de garantir la performance, la scalabilité et la haute disponibilité via une séparation claire des services (Frontend, API Gateway, Base de données, et Cache en mémoire).

---

## Architecture et Choix Techniques

L'application est découpée en 4 composants majeurs interagissant de manière isolée au sein du cluster :

1. **Frontend (Vue.js 3 / Vite + Nginx)**
   * Interface utilisateur dynamique permettant la recherche, le filtrage et la gestion des favoris.
   * Déployé avec **2 réplicas** pour la haute disponibilité.
   * Utilise Nginx comme serveur web et **reverse proxy** pour rediriger les requêtes `/api/` vers le backend, évitant ainsi les problèmes de CORS.
   * Exposition externe via un service **NodePort** (30080).

2. **Backend (FastAPI / Python)**
   * API REST asynchrone gérant la logique métier, la communication avec TMDB et les requêtes internes.
   * Déployé avec **2 réplicas**.
   * Sécurisé au sein du cluster via un service **ClusterIP** (inaccessible directement depuis l'extérieur).

3. **Base de Données (PostgreSQL 15)**
   * Stockage relationnel garantissant la persistance des films favoris des utilisateurs.
   * Déployé avec **1 réplica** et couplé à un **PersistentVolumeClaim (PVC)** pour éviter la perte de données lors du redémarrage des pods.

4. **Cache (Redis Alpine)**
   * Système de cache en mémoire (stratégie cache-aside) stockant temporairement les données TMDB (ex: genres avec un TTL de 24h).
   * Permet de réduire drastiquement la latence et d'économiser les quotas de l'API externe.

---

## Guide de Déploiement Local

Le déploiement a été entièrement automatisé pour fonctionner dans un environnement de développement local via Minikube.

### Prérequis
* **Docker**
* **Minikube**
* **kubectl**

### Instructions de lancement

1.Rendez le script de démarrage exécutable :
   ```bash
   chmod +x start.sh
   ./start.sh
