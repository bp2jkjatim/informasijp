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

Example:
  SSH_HOST=203.0.113.10 SSH_USER=deploy ./deploy/deploy.sh
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

SSH_TARGET="${SSH_USER}@${SSH_HOST}"

ssh -p "$SSH_PORT" "$SSH_TARGET" bash -se -- "$REMOTE_DIR" "$BRANCH" "$REPO_URL" <<'REMOTE_SCRIPT'
set -euo pipefail

REMOTE_DIR="$1"
BRANCH="$2"
REPO_URL="$3"

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
ENV_FILE

  chmod 600 .env.production
  echo "Created $REMOTE_DIR/app/.env.production with generated credentials"
fi

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
REMOTE_SCRIPT
