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

REMOTE_DEPLOY_SCRIPT="$REMOTE_DIR/app/deploy/remote-deploy.sh"

if [[ ! -f "$REMOTE_DEPLOY_SCRIPT" ]]; then
  echo "Expected remote deploy script is missing from this checkout"
  exit 1
fi

bash "$REMOTE_DEPLOY_SCRIPT" "$REMOTE_DIR" "$UPLOADS_HOST_DIR"
REMOTE_SCRIPT
