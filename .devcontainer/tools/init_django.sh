#!/bin/bash

python3 -m venv /workspaces/app/webappenv

source /workspaces/app/webappenv/bin/activate

pip install django psycopg2-binary
/workspaces/app/transendence/manage.py makemigrations
/workspaces/app/transendence/manage.py migrate
pip install whitenoise

python3 /workspaces/app/transendence/manage.py runserver 0.0.0.0:8000
