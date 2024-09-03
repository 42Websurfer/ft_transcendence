FROM postgres:latest

ARG DB_USER

#COPY ./tools/init_db.sh /usr/local/bin/init_db.sh

#RUN chmod +x /usr/local/bin/init_db.sh
RUN useradd -u 1000 -M ${DB_USER}
USER ${DB_USER}

CMD ["postgres"]