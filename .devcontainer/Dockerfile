FROM ubuntu:20.04

RUN apt-get -y update && apt-get -y upgrade && \
    apt-get -y install \
    curl \
    git \
    vim \
    nginx \
    python3 \
    python3-venv \
    postgresql \
    postgresql-contrib \
    net-tools \
    && apt-get autoremove -y \
    && apt-get clean -y

#CMD ["tail -f "]
