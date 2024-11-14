#!/bin/bash

python3 -m venv /workspaces/app/webappenv

source /workspaces/app/webappenv/bin/activate

pip install --upgrade setuptools
pip install django psycopg2-binary
pip install whitenoise
pip install channels
pip install daphne
pip install channels_redis
pip install requests
pip install Pillow
pip install djangorestframework 
pip install djangorestframework-simplejwt
/workspaces/app/transendence/manage.py makemigrations-
/workspaces/app/transendence/manage.py migrate
export PYTHONPATH=/workspaces/app/transendence
daphne -p 8001 -b 0.0.0.0 transendence.asgi:application &
python3 /workspaces/app/transendence/manage.py runserver 0.0.0.0:8000
