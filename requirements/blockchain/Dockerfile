FROM python:3.9

WORKDIR /app

COPY ./tools/blockchain_service.py .

RUN pip install flask web3 eth-account

CMD ["python", "blockchain_service.py"]