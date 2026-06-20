#!/bin/sh
set -e

# Apply Django internal migrations (SQLite: auth/sessions/admin)
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files (DRF browsable API, admin)
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Start the application server
echo "Starting Gunicorn on 0.0.0.0:8000..."
exec gunicorn termsheet_processor.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --timeout "${GUNICORN_TIMEOUT:-180}"
