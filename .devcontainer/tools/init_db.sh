#!/bin/bash

service postgresql start

sleep 5

su - postgres -c "psql <<EOF
CREATE DATABASE $DATABASE_NAME;
CREATE USER $DATABASE_USER WITH PASSWORD '$DATABASE_PW';
GRANT ALL PRIVILEGES ON DATABASE $DATABASE_NAME TO $DATABASE_USER;
EOF"

python3 -m venv /workspaces/app/webappenv

source /workspaces/app/webappenv/bin/activate

pip install django psycopg2-binary
/workspaces/app/transendence/manage.py makemigrations
/workspaces/app/transendence/manage.py migrate

nginx -g "daemon off;"