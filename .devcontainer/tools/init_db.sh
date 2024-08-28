#!/bin/bash

service postgresql start

sleep 5

su - postgres -c "psql <<EOF
CREATE DATABASE $DATABASE_NAME;
CREATE USER $DATABASE_USER WITH PASSWORD '$DATABASE_PW';
GRANT ALL PRIVILEGES ON DATABASE $DATABASE_NAME TO $DATABASE_USER;
EOF"

python -m venv /workspace/app/webappenv

source /workspace/app/webappenv/bin/activate

pip install django

nginx -g "daemon off;"