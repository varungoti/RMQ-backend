#!/bin/bash

# CI/CD script to check for incorrect createHybridResponse usage
# This script runs our custom check and exits with a non-zero code if issues are found
# Usage: ./scripts/ci-check-hybrid-response.sh

set -e

echo "Running createHybridResponse usage check..."

# Change to the project root directory
cd "$(dirname "$0")/.."

# Run the check script
node scripts/check-hybrid-response-usage.js

# Script will exit with non-zero code if issues are found, which will fail the CI job
echo "createHybridResponse check passed!" 