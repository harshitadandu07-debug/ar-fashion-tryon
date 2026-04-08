#!/usr/bin/env bash
# Run this AFTER you create an empty repo on GitHub (same name, no README).
# Usage: ./scripts/after-github-repo-created.sh YOUR_GITHUB_USERNAME
set -euo pipefail

USERNAME="${1:-}"
REPO_NAME="${GITHUB_REPO_NAME:-ar-fashion-tryon}"

if [[ -z "$USERNAME" ]]; then
  echo "Usage: $0 <your-github-username>"
  echo "Optional: GITHUB_REPO_NAME=my-repo $0 <username>  (default repo: $REPO_NAME)"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

URL="https://github.com/${USERNAME}/${REPO_NAME}.git"

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$URL"
  echo "Updated remote origin -> $URL"
else
  git remote add origin "$URL"
  echo "Added remote origin -> $URL"
fi

git branch -M main
echo "Pushing main to origin (you may need to sign in or use a personal access token)..."
git push -u origin main
echo "Done."
