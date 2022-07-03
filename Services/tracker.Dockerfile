FROM python:3.10-alpine3.16

RUN apk update && apk add build-base && python3 -m pip install --upgrade pip && adduser -D worker
USER worker

COPY --chown=worker:worker ./doserve /home/worker/doserve
COPY --chown=worker:worker ./Tools /home/worker/Tools
COPY --chown=worker:worker ./MintingBackend /home/worker/MintingBackend
COPY --chown=worker:worker ./config.production.py /home/worker/doserve/config.py

RUN pip install --user web3 eth_abi

WORKDIR /home/worker/

ENV PATH="/home/worker/.local/bin:${PATH}"

ENV PYTHONPATH="/home/worker/"

ENTRYPOINT ["python3", "Tools/chainlisten/tracker.py"]

CMD ["listen"]
