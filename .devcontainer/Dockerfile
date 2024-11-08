FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Update and install necessary packages including tzdata
RUN apt-get update && \
    apt-get install -y \
    tzdata \
    curl \
    git \
    vim \
    python3 \
    python3-venv && \
    ln -fs /usr/share/zoneinfo/Etc/UTC /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata && \
    apt-get autoremove -y && \
    apt-get clean -y

COPY ./tools/init_django.sh /usr/local/bin/init_django.sh

RUN echo "alias dstart='cd /workspaces/app/transendence/ && /workspaces/app/webappenv/bin/daphne -p 8001 -b 0.0.0.0 transendence.asgi:application'" >> ~/.bashrc

RUN chmod +x /usr/local/bin/init_django.sh

CMD ["/usr/local/bin/init_django.sh"]
