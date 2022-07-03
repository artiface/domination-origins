FROM node:14-bullseye-slim

RUN apt-get update && apt-get install --fix-missing -qy python3 python3-pip pkg-config imagemagick && python3 -m pip install --upgrade pip &&  \
    adduser --gecos "" --disabled-password worker && mkdir -p /home/worker && chown -R worker: /home/worker

USER worker

COPY --chown=worker:worker ./MintingBackend /home/worker/MintingBackend
COPY --chown=worker:worker ./hashlips_art_engine /home/worker/hashlips_art_engine
COPY --chown=worker:worker ./Tools /home/worker/Tools
COPY --chown=worker:worker ./doserve /home/worker/doserve
COPY --chown=worker:worker ./config.production.py /home/worker/doserve/config.production.py

RUN cd /home/worker/MintingBackend/ && pip install --user -r requirements.txt && \
    cd /home/worker/hashlips_art_engine/ && yarn install

WORKDIR /home/worker/MintingBackend/
ENV PYTHONPATH="/home/worker/"
ENTRYPOINT ["python3", "mintServer.py"]