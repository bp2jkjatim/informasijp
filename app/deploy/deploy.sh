#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Deploy the Informasi JP app to a Docker host over SSH.

Required:
  SSH_HOST=server.example.com

Optional:
  SSH_USER=root
  SSH_PORT=22
  REMOTE_DIR=/opt/informasijp
  BRANCH=v2
  REPO_URL=https://github.com/bp2jkjatim/informasijp.git
  UPLOADS_HOST_DIR=/mnt/nas/informasijp/uploads

Example:
  SSH_HOST=203.0.113.10 SSH_USER=deploy UPLOADS_HOST_DIR=/mnt/nas/informasijp/uploads ./deploy/deploy.sh
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -z "${SSH_HOST:-}" ]]; then
  usage
  exit 1
fi

SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/opt/informasijp}"
BRANCH="${BRANCH:-v2}"
REPO_URL="${REPO_URL:-https://github.com/bp2jkjatim/informasijp.git}"
UPLOADS_HOST_DIR="${UPLOADS_HOST_DIR:-/mnt/nas/informasijp/uploads}"

SSH_TARGET="${SSH_USER}@${SSH_HOST}"

ssh -p "$SSH_PORT" "$SSH_TARGET" bash -se -- "$REMOTE_DIR" "$BRANCH" "$REPO_URL" "$UPLOADS_HOST_DIR" <<'REMOTE_SCRIPT'
set -euo pipefail

REMOTE_DIR="$1"
BRANCH="$2"
REPO_URL="$3"
UPLOADS_HOST_DIR="$4"
export UPLOADS_HOST_DIR

if ! command -v git >/dev/null 2>&1; then
  echo "git is required on the server"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the server"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required on the server"
  exit 1
fi

if [[ -d "$REMOTE_DIR/.git" ]]; then
  cd "$REMOTE_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  if [[ -e "$REMOTE_DIR" ]]; then
    if [[ -n "$(find "$REMOTE_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
      echo "$REMOTE_DIR already exists, is not a git repository, and is not empty"
      exit 1
    fi
    git clone --branch "$BRANCH" "$REPO_URL" "$REMOTE_DIR"
    cd "$REMOTE_DIR"
  else
    git clone --branch "$BRANCH" "$REPO_URL" "$REMOTE_DIR"
    cd "$REMOTE_DIR"
  fi
fi

cd "$REMOTE_DIR/app"
GIT_COMMIT="$(git rev-parse HEAD)"
GIT_COMMIT_SHORT="$(git rev-parse --short HEAD)"
export GIT_COMMIT

echo "Deploying Informasi JP commit ${GIT_COMMIT_SHORT}"

if [[ ! -f "src/components/training-detail.tsx" ]]; then
  echo "Expected diklat detail component is missing from this checkout"
  exit 1
fi

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    date +%s%N | sha256sum | awk '{print $1}'
  fi
}

if [[ ! -f .env.production ]]; then
  mysql_root_password="$(random_secret)"
  mysql_password="$(random_secret)"
  session_secret="$(random_secret)"

  cat > .env.production <<ENV_FILE
MYSQL_ROOT_PASSWORD=${mysql_root_password}
MYSQL_DATABASE=informasijp_app
MYSQL_USER=informasijp
MYSQL_PASSWORD=${mysql_password}

DATABASE_URL=mysql://informasijp:${mysql_password}@mariadb:3306/informasijp_app
SESSION_SECRET=${session_secret}
NEXT_PUBLIC_BASE_PATH=/sisdm
UPLOADS_DIR=/app/uploads
ENV_FILE

  chmod 600 .env.production
  echo "Created $REMOTE_DIR/app/.env.production with generated credentials"
fi

mkdir -p "$UPLOADS_HOST_DIR/certificates" "$UPLOADS_HOST_DIR/supporting-documents"

migrate_uploads_from_legacy_volume() {
  local target_dir="$1"
  local project_name="${COMPOSE_PROJECT_NAME:-$(basename "$PWD")}"
  local legacy_volumes=(
    "${project_name}_uploads_data"
    "uploads_data"
  )
  local source_volume=""

  for candidate in "${legacy_volumes[@]}"; do
    if docker volume inspect "$candidate" >/dev/null 2>&1; then
      source_volume="$candidate"
      break
    fi
  done

  if [[ -z "$source_volume" ]]; then
    echo "No legacy uploads volume found. Skipping file migration."
    return
  fi

  echo "Migrating uploads from Docker volume ${source_volume} to ${target_dir}"
  docker run --rm \
    -v "${source_volume}:/from:ro" \
    -v "${target_dir}:/to" \
    alpine:3.20 \
    sh -c 'mkdir -p /to && cp -a /from/. /to/ 2>/dev/null || true'
}

docker compose -f docker-compose.prod.yml build app migrate
docker compose -f docker-compose.prod.yml up -d mariadb
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml stop app >/dev/null 2>&1 || true
docker compose -f docker-compose.prod.yml rm -f app >/dev/null 2>&1 || true
migrate_uploads_from_legacy_volume "$UPLOADS_HOST_DIR"
docker compose -f docker-compose.prod.yml up -d app
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec -T app sh -c 'echo "Running app commit: ${APP_GIT_COMMIT}"'
docker compose -f docker-compose.prod.yml ps -q app | xargs -r docker inspect --format 'App container created: {{.Created}}'
REMOTE_SCRIPT
