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

COPY ./tools/init_db.sh /usr/local/bin/init_db.sh

RUN chmod +x /usr/local/bin/init_db.sh

CMD ["/usr/local/bin/init_db.sh"]
