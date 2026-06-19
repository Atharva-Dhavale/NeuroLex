#!/bin/bash
# Start the NeuroLex backend server
echo "Starting NeuroLex backend..."
cd "$(dirname "$0")/backend"
/opt/homebrew/bin/python3.10 manage.py runserver 8000
