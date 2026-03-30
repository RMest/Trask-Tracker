#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
  # Export all vars from .env into this shell.
  set -a
  . ./.env
  set +a
fi

mvn spring-boot:run
