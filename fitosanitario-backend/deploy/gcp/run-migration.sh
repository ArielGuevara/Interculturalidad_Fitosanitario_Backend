#!/bin/bash
set -euo pipefail

PROJECT_ID="project-01900fb5-a41d-424c-940"
REGISTRY="us-central1-docker.pkg.dev"
IMAGE="${REGISTRY}/${PROJECT_ID}/fitosanitario/migration:latest"

TOKEN="$(
  curl -fsS \
    -H 'Metadata-Flavor: Google' \
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' \
    | jq -r '.access_token'
)"

DATABASE_URL="$(
  curl -fsS \
    -H "Authorization: Bearer ${TOKEN}" \
    "https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/fitosanitario-database-url/versions/latest:access" \
    | jq -r '.payload.data' \
    | base64 -d
)"

echo "${TOKEN}" | sudo docker login \
  --username oauth2accesstoken \
  --password-stdin \
  "https://${REGISTRY}"

sudo docker pull "${IMAGE}"
sudo docker run --rm \
  --network host \
  --env DATABASE_URL="${DATABASE_URL}" \
  "${IMAGE}"

unset TOKEN DATABASE_URL
