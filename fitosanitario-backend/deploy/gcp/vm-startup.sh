#!/bin/bash
set -euo pipefail

PROJECT_ID="project-01900fb5-a41d-424c-940"
DATABASE_SECRET="fitosanitario-database-url"
MINIO_USER_SECRET="fitosanitario-minio-user"
MINIO_PASSWORD_SECRET="fitosanitario-minio-password"

export DEBIAN_FRONTEND=noninteractive
if ! command -v docker >/dev/null || ! command -v jq >/dev/null; then
  apt-get update
  apt-get install -y --no-install-recommends ca-certificates curl docker.io jq python3
fi
systemctl enable --now docker

if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

mkdir -p /srv/fitosanitario/postgres /srv/fitosanitario/minio

access_token() {
  curl -fsS \
    -H 'Metadata-Flavor: Google' \
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' \
    | jq -r '.access_token'
}

secret_value() {
  local secret_name="$1"
  local token
  token="$(access_token)"
  curl -fsS \
    -H "Authorization: Bearer ${token}" \
    "https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/${secret_name}/versions/latest:access" \
    | jq -r '.payload.data' \
    | base64 -d
}

DATABASE_URL="$(secret_value "${DATABASE_SECRET}")"
POSTGRES_PASSWORD="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.urlparse(sys.argv[1]).password)' "${DATABASE_URL}")"
MINIO_ROOT_USER="$(secret_value "${MINIO_USER_SECRET}")"
MINIO_ROOT_PASSWORD="$(secret_value "${MINIO_PASSWORD_SECRET}")"

docker rm -f fitosanitario-postgres fitosanitario-minio 2>/dev/null || true

docker run -d \
  --name fitosanitario-postgres \
  --restart unless-stopped \
  --memory 320m \
  --memory-swap 512m \
  --shm-size 64m \
  -p 5432:5432 \
  -e POSTGRES_USER=fitosanitario \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_DB=fitosanitario \
  -v /srv/fitosanitario/postgres:/var/lib/postgresql/data \
  postgres:16-alpine \
  -c max_connections=30 \
  -c shared_buffers=64MB \
  -c effective_cache_size=256MB \
  -c work_mem=2MB \
  -c maintenance_work_mem=32MB

docker run -d \
  --name fitosanitario-minio \
  --restart unless-stopped \
  --memory 320m \
  --memory-swap 512m \
  -p 9000:9000 \
  -p 127.0.0.1:9001:9001 \
  -e MINIO_ROOT_USER="${MINIO_ROOT_USER}" \
  -e MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}" \
  -e MINIO_API_REQUESTS_MAX=8 \
  -e GOMEMLIMIT=280MiB \
  -v /srv/fitosanitario/minio:/data \
  minio/minio:latest server /data --console-address ':9001'

unset DATABASE_URL POSTGRES_PASSWORD MINIO_ROOT_USER MINIO_ROOT_PASSWORD
