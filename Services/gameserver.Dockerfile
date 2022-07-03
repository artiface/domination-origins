FROM python:3.10-alpine

RUN apk update && apk add build-base && python3 -m pip install --upgrade pip && adduser -D worker
USER worker

COPY --chown=worker:worker ./doserve /home/worker/doserve
COPY --chown=worker:worker ./assets /home/worker/assets
COPY --chown=worker:worker ./config.production.py /home/worker/doserve/config.py

RUN pip install --user -r /home/worker/doserve/gameserver.requirements.txt

WORKDIR /home/worker/doserve

ENV PATH="/home/worker/.local/bin:${PATH}"

ENV PYTHONPATH="/home/worker/"

CMD ["python3", "server.py"]

EXPOSE 8000/tcp