#!/bin/bash
# Generate cryptographic secrets for .env.local
# Usage: ./scripts/generate-env-secrets.sh

echo "# Generated secrets — paste into .env.local"
echo "BETTER_AUTH_SECRET=\"$(openssl rand -hex 32)\""
echo "TOKEN_ENCRYPTION_KEY=\"$(openssl rand -hex 32)\""
