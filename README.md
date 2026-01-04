# Tron - Platform as a Service

PaaS platform built on top of Kubernetes that simplifies application deployment and management.

## 🚀 Quick Start

### Prerequisites

- Docker
- Docker Compose

### Running the Project

Run a single command to start the entire environment:

```bash
make start
```

This command will:
- ✅ Start the FastAPI API (http://localhost:8000)
- ✅ Start the React Portal (http://localhost:3000)
- ✅ Start the PostgreSQL database
- ✅ Start the Kubernetes cluster (K3s)
- ✅ Run database migrations
- ✅ Load initial templates
- ✅ Create default administrator user
- ✅ Configure API token
- ✅ Create "local" environment
- ✅ Configure local cluster

### Access the Portal

After running `make start`, access:

**URL**: [http://localhost:3000](http://localhost:3000)

**Default credentials**:
- **Email**: `admin@example.com`
- **Password**: `admin`

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 🛠️ Useful Commands

### Environment Management

```bash
# Start environment
make start

# Stop environment
make stop

# View logs
make logs

# Check service status
make status

# Rebuild images
make build
```

### Database Migrations

```bash
# Create new migration
make api-migration

# Apply migrations
make api-migrate
```

### Using kubectl with K3s

To interact with the local K3s cluster:

```bash
export KUBECONFIG=./volumes/kubeconfig/kubeconfig.yaml
kubectl get nodes
```

## 🏗️ Architecture

The project is organized as a monorepo containing:

- **API** (`/api`): FastAPI backend with cluster, environment, application, and template management
- **Portal** (`/portal`): React frontend for user interface
- **Scripts** (`/scripts`): Automation and setup scripts

## 🔐 Authentication

The platform supports two authentication methods:

1. **JWT (JSON Web Tokens)**: For web portal users
2. **API Tokens**: For programmatic access via `x-tron-token` header

### User Roles

- **Admin**: Full access to all resources
- **User**: Limited access (read-only on administrative resources)
- **Viewer**: Read-only access

## 📖 Main Features

- **Cluster Management**: Add and manage Kubernetes clusters
- **Environments**: Organize resources by environments (dev, staging, production)
- **Applications**: Application deployment and management
- **Templates**: Reusable templates for components
- **Users**: User and permission management
- **API Tokens**: Tokens for programmatic access

## 🔧 Development

### Project Structure

```
tron/
├── api/              # FastAPI backend
├── portal/           # React frontend
├── scripts/          # Automation scripts
├── docker/           # Docker Compose configurations
└── volumes/          # Persistent volumes (kubeconfig, tokens)
```

### Environment Variables

Main environment variables can be configured in the `docker/docker-compose.yaml` file or through `.env` files.

---

**Built with ❤️ to simplify Kubernetes application management**
