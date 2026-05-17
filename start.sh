#!/bin/bash

set -e

echo "Démarrage de l'architecture microservices (Catalogue Films - MongoDB Edition)..."

# 1. Démarrer Minikube si éteint
if ! minikube status > /dev/null 2>&1; then
    echo "Lancement de Minikube..."
    minikube start
fi

# 2. Pointer Docker vers le daemon de minikube
eval $(minikube docker-env)

# 3. Build des images
echo "Build des images Docker..."
docker build -t catalogue-backend:Node01 ./backend
docker build -t catalogue-frontend:Node01 ./frontend

# 4. Appliquer les manifests
echo "Déploiement des ressources Kubernetes..."
kubectl apply -f k8s/

# 5. Rollout forcé (pour que les pods reprennent la nouvelle image même avec le même tag)
echo "Rollout des nouvelles images..."
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/frontend

# 6. Attendre que tout soit prêt
echo "Attente du démarrage des pods..."
kubectl rollout status deployment/mongodb --timeout=120s
kubectl rollout status deployment/redis --timeout=60s
kubectl rollout status deployment/backend --timeout=120s
kubectl rollout status deployment/frontend --timeout=60s

# 7. URL d'accès
NODE_IP=$(minikube ip)
NODE_PORT=$(kubectl get svc frontend-service -o jsonpath='{.spec.ports[0].nodePort}')

echo "=================================================="
echo "SYSTÈME OPÉRATIONNEL !"
echo "Interface Web : http://${NODE_IP}:${NODE_PORT}"
echo "=================================================="
