#!/bin/bash
# Start the NeuroLex frontend dev server
echo "Starting NeuroLex frontend..."
cd "$(dirname "$0")/frontend"
/opt/homebrew/bin/npm run dev
