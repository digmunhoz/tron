#!/bin/bash

set -e

# Configurações
API_URL="${API_URL:-http://localhost:8000}"
CLUSTER_NAME="k3s"
API_ADDRESS="https://k3s-server:5443"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-local}"
KUBECONFIG="${KUBECONFIG:-./volumes/kubeconfig/kubeconfig.yaml}"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Configurando cluster K3s na plataforma...${NC}"

# Verificar se o kubeconfig existe
if [ ! -f "$KUBECONFIG" ]; then
    echo -e "${RED}❌ Erro: Kubeconfig não encontrado em $KUBECONFIG${NC}"
    echo -e "${YELLOW}💡 Certifique-se de que o K3s está rodando (make start)${NC}"
    exit 1
fi

# Exportar KUBECONFIG
export KUBECONFIG

# Verificar se kubectl consegue se conectar
if ! kubectl cluster-info &>/dev/null; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao cluster K3s${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Conectado ao cluster K3s${NC}"

# Criar ServiceAccount se não existir
if ! kubectl -n kube-system get sa tron &>/dev/null; then
    echo -e "${YELLOW}📝 Criando ServiceAccount 'tron'...${NC}"
    kubectl -n kube-system create sa tron
else
    echo -e "${GREEN}✓ ServiceAccount 'tron' já existe${NC}"
fi

# Criar Secret se não existir
if ! kubectl -n kube-system get secret tron &>/dev/null; then
    echo -e "${YELLOW}📝 Criando Secret 'tron'...${NC}"
    kubectl -n kube-system apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: tron
  annotations:
    kubernetes.io/service-account.name: tron
type: kubernetes.io/service-account-token
EOF
else
    echo -e "${GREEN}✓ Secret 'tron' já existe${NC}"
fi

# Criar ClusterRoleBinding se não existir
if ! kubectl -n kube-system get clusterrolebinding tron &>/dev/null; then
    echo -e "${YELLOW}📝 Criando ClusterRoleBinding 'tron'...${NC}"
    kubectl -n kube-system create clusterrolebinding tron --clusterrole=cluster-admin --serviceaccount=kube-system:tron
else
    echo -e "${GREEN}✓ ClusterRoleBinding 'tron' já existe${NC}"
fi

# Aguardar o token ser gerado (pode levar alguns segundos)
echo -e "${YELLOW}⏳ Aguardando geração do token...${NC}"
sleep 3

# Obter o token
TOKEN=$(kubectl -n kube-system get secret tron -o jsonpath="{.data.token}" | base64 -d)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Erro: Não foi possível obter o token do ServiceAccount${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token obtido com sucesso${NC}"

# Verificar se a API está acessível
if ! curl -s -f "${API_URL}/docs" &>/dev/null; then
    echo -e "${RED}❌ Erro: API não está acessível em ${API_URL}${NC}"
    echo -e "${YELLOW}💡 Certifique-se de que a API está rodando (make start)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ API está acessível${NC}"

# Buscar ambiente "local" ou criar se não existir
echo -e "${YELLOW}🔍 Buscando ambiente '${ENVIRONMENT_NAME}'...${NC}"
ENVIRONMENTS_RESPONSE=$(curl -s "${API_URL}/environments/")

# Tentar usar jq se disponível, senão usar grep
if command -v jq &> /dev/null; then
    ENVIRONMENT_UUID=$(echo "$ENVIRONMENTS_RESPONSE" | jq -r ".[] | select(.name == \"${ENVIRONMENT_NAME}\") | .uuid" | head -1)
else
    # Fallback: buscar por nome e extrair UUID
    ENVIRONMENT_UUID=$(echo "$ENVIRONMENTS_RESPONSE" | grep -A10 "\"name\":\"${ENVIRONMENT_NAME}\"" | grep -o "\"uuid\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
fi

if [ -z "$ENVIRONMENT_UUID" ] || [ "$ENVIRONMENT_UUID" = "null" ]; then
    echo -e "${YELLOW}📝 Criando ambiente '${ENVIRONMENT_NAME}'...${NC}"
    ENVIRONMENT_RESPONSE=$(curl -s -X POST "${API_URL}/environments/" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"${ENVIRONMENT_NAME}\"}")

    if command -v jq &> /dev/null; then
        ENVIRONMENT_UUID=$(echo "$ENVIRONMENT_RESPONSE" | jq -r '.uuid')
        ERROR_MSG=$(echo "$ENVIRONMENT_RESPONSE" | jq -r '.detail // empty')
    else
        ENVIRONMENT_UUID=$(echo "$ENVIRONMENT_RESPONSE" | grep -o "\"uuid\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
        ERROR_MSG=$(echo "$ENVIRONMENT_RESPONSE" | grep -o "\"detail\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
    fi

    if [ -z "$ENVIRONMENT_UUID" ] || [ "$ENVIRONMENT_UUID" = "null" ] || [ -n "$ERROR_MSG" ]; then
        echo -e "${RED}❌ Erro: Não foi possível criar o ambiente${NC}"
        echo "$ENVIRONMENT_RESPONSE"
        exit 1
    fi
    echo -e "${GREEN}✓ Ambiente '${ENVIRONMENT_NAME}' criado (UUID: ${ENVIRONMENT_UUID})${NC}"
else
    echo -e "${GREEN}✓ Ambiente '${ENVIRONMENT_NAME}' encontrado (UUID: ${ENVIRONMENT_UUID})${NC}"
fi

# Buscar cluster "k3s"
echo -e "${YELLOW}🔍 Buscando cluster '${CLUSTER_NAME}'...${NC}"
CLUSTERS_RESPONSE=$(curl -s "${API_URL}/clusters/")

# Tentar usar jq se disponível, senão usar grep
if command -v jq &> /dev/null; then
    CLUSTER_UUID=$(echo "$CLUSTERS_RESPONSE" | jq -r ".[] | select(.name == \"${CLUSTER_NAME}\") | .uuid" | head -1)
else
    # Fallback: buscar por nome e extrair UUID
    CLUSTER_UUID=$(echo "$CLUSTERS_RESPONSE" | grep -B5 "\"name\":\"${CLUSTER_NAME}\"" | grep -o "\"uuid\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
fi

if [ -z "$CLUSTER_UUID" ] || [ "$CLUSTER_UUID" = "null" ]; then
    # Criar cluster
    echo -e "${YELLOW}📝 Criando cluster '${CLUSTER_NAME}'...${NC}"
    CLUSTER_RESPONSE=$(curl -s -X POST "${API_URL}/clusters/" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${CLUSTER_NAME}\",
            \"api_address\": \"${API_ADDRESS}\",
            \"token\": \"${TOKEN}\",
            \"environment_uuid\": \"${ENVIRONMENT_UUID}\"
        }")

    if command -v jq &> /dev/null; then
        ERROR_MSG=$(echo "$CLUSTER_RESPONSE" | jq -r '.detail // empty')
        if [ -n "$ERROR_MSG" ] && [ "$ERROR_MSG" != "null" ]; then
            echo -e "${RED}❌ Erro ao criar cluster:${NC}"
            echo "$CLUSTER_RESPONSE" | jq .
            exit 1
        fi
        CLUSTER_UUID=$(echo "$CLUSTER_RESPONSE" | jq -r '.uuid')
    else
        if echo "$CLUSTER_RESPONSE" | grep -q "\"detail\""; then
            echo -e "${RED}❌ Erro ao criar cluster:${NC}"
            echo "$CLUSTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CLUSTER_RESPONSE"
            exit 1
        fi
        CLUSTER_UUID=$(echo "$CLUSTER_RESPONSE" | grep -o "\"uuid\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
    fi

    echo -e "${GREEN}✓ Cluster '${CLUSTER_NAME}' criado com sucesso (UUID: ${CLUSTER_UUID})${NC}"
else
    # Atualizar token do cluster
    echo -e "${YELLOW}📝 Atualizando token do cluster '${CLUSTER_NAME}'...${NC}"
    UPDATE_RESPONSE=$(curl -s -X PUT "${API_URL}/clusters/${CLUSTER_UUID}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${CLUSTER_NAME}\",
            \"api_address\": \"${API_ADDRESS}\",
            \"token\": \"${TOKEN}\",
            \"environment_uuid\": \"${ENVIRONMENT_UUID}\"
        }")

    if command -v jq &> /dev/null; then
        ERROR_MSG=$(echo "$UPDATE_RESPONSE" | jq -r '.detail // empty')
        if [ -n "$ERROR_MSG" ] && [ "$ERROR_MSG" != "null" ]; then
            echo -e "${RED}❌ Erro ao atualizar cluster:${NC}"
            echo "$UPDATE_RESPONSE" | jq .
            exit 1
        fi
    else
        if echo "$UPDATE_RESPONSE" | grep -q "\"detail\""; then
            echo -e "${RED}❌ Erro ao atualizar cluster:${NC}"
            echo "$UPDATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPDATE_RESPONSE"
            exit 1
        fi
    fi

    echo -e "${GREEN}✓ Token do cluster '${CLUSTER_NAME}' atualizado com sucesso${NC}"
fi

echo -e "${GREEN}🎉 Configuração concluída!${NC}"

