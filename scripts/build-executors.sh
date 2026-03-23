#!/usr/bin/env bash
set -euo pipefail

echo "Building executor sandbox images..."

build_image() {
  local lang=$1
  local image_name="collab-executor-${lang}:latest"
  local dockerfile="executor/containers/${lang}/Dockerfile"

  if [[ -f "$dockerfile" ]]; then
    echo "  Building ${image_name}..."
    docker build -t "$image_name" -f "$dockerfile" executor/containers/${lang}/
    echo "  ✓ ${image_name}"
  else
    echo "  ✗ Dockerfile not found: $dockerfile"
  fi
}

build_image "javascript"
build_image "python"
build_image "java"
build_image "cpp"

echo "All executor images built successfully."
echo ""
echo "Images:"
docker images | grep collab-executor
