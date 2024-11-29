#!/bin/sh

CERT_DIR=/etc/nginx/conf.d/cert
CERT_FILE=$CERT_DIR/nginx.crt
KEY_FILE=$CERT_DIR/nginx.key

mkdir -p $CERT_DIR

if [ ! -f $CERT_FILE ] || [ ! -f $KEY_FILE ]; then
    echo "Creating self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $KEY_FILE -out $CERT_FILE -subj "/C=AT/ST=VIENNA/L=VIENNA/O=42/CN=websurfers.com" > /dev/null
else
    echo "Certificate already exists."
fi

nginx -g 'daemon off;'