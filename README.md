# PaaS Platform (API)

This project is part of a **Platform-as-a-Service (PaaS)**, designed to abstract Kubernetes and underlying infrastructure, simplifying application deployment and management.

Currently, only the **API** component is under development, but the project will ultimately include both a **portal** and an **API**, organized in a monorepo.

## Project Overview

- **Framework**: FastAPI
- **Local Development**: Docker with Docker Compose
- **Kubernetes**: K3s (lightweight Kubernetes)

### Features

- **Cluster Management**: The platform introduces the concept of **JOINING clusters**, allowing Kubernetes clusters to be managed through the API.
- **JOIN Process**: After creating a Service Account with secret and ClusterRoleBinding, the Kubernetes cluster can be added to the platform by providing the token from the secret in the JOIN request.

### Local Setup

This project uses Docker Compose to set up the local environment, including the API, database, and a local Kubernetes cluster (K3s).

#### Prerequisites

- Docker
- Docker Compose

#### Local Environment Setup

1. **Clone the repository**:
    ```bash
    git clone git@github.com:digmunhoz/tron.git
    cd tron
    ```

2. **Start the environment** using Docker Compose:
    ```bash
    make start
    ```

   This command will start:
   - The FastAPI application
   - A PostgreSQL database
   - A K3s cluster

3. **View logs**:
    ```bash
    make logs
    ```

4. **Stop the environment**:
    ```bash
    make stop
    ```

5. **Check the status of the services**:
    ```bash
    make status
    ```

#### Managing Database Migrations

- **Create a new migration**:
    ```bash
    make api-migration
    ```

- **Apply migrations**:
    ```bash
    make api-migrate
    ```

#### Using kubectl with K3s

Once the local environment is up, you can use `kubectl` to interact with the K3s cluster. Just run the following command to set the KUBECONFIG:

```bash
export KUBECONFIG=./volumes/kubeconfig/kubeconfig.yaml
```

### API Documentation

The API documentation is available at the following endpoints:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Cluster Join Example

Before joining a Kubernetes cluster, you need to create an **Environment**. This is done by making a POST request to the `/environments` endpoint:

#### Example: Create Environment

```bash
curl -X POST "http://localhost:8000/environments" \
-H "Content-Type: application/json" \
-d '{
  "name": "production"
}'
```

Once the environment is created, you can proceed with joining the cluster to the platform.

#### Example: ServiceAccount and ClusterRoleBinding

Create a ServiceAccount with a secret and a ClusterRoleBinding to give it necessary permissions:

```shell
kubectl -n kube-system create sa tron
kubectl -n kube-system apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: tron
  annotations:
    kubernetes.io/service-account.name: tron
type: kubernetes.io/service-account-token
EOF
kubectl -n kube-system create clusterrolebinding tron --clusterrole=cluster-admin --serviceaccount=kube-system:tron

export TOKEN=`kubectl -n kube-system get secret tron -o jsonpath="{.data.token}" | base64 -d`
```

Once this is set up, retrieve the token from the secret and use it in your JOIN API request:

```bash
curl -X POST "http://localhost:8000/clusters/" \
-H "Content-Type: application/json" \
-d '{
  "name": "my-cluster",
  "endpoint": "https://my-cluster-endpoint",
  "token": "<your_token>",
  "environment_uuid": "<environment_uuid>"
}'
```

### Makefile Commands

- `start`: Starts the local environment (API, DB, K3s).
- `build`: Builds the Docker images.
- `stop`: Stops the environment.
- `logs`: Shows logs from the running containers.
- `status`: Shows the status of the services.
- `api-migrate`: Runs database migrations.
- `api-migration`: Creates a new migration file.
- `api-test`: Runs API tests.

---

This README covers the essential information for setting up, running, and interacting with the API, as well as the process for adding Kubernetes clusters to the platform.