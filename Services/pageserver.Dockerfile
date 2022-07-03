FROM python:3.10-alpine3.16

RUN apk update && apk add build-base && python3 -m pip install --upgrade pip && adduser -D worker
USER worker

COPY --chown=worker:worker ./doserve /home/worker/doserve
COPY --chown=worker:worker ./config.production.py /home/worker/doserve/config.py

RUN pip install --user -r /home/worker/doserve/servepages.requirements.txt

WORKDIR /home/worker/doserve

ENV PATH="/home/worker/.local/bin:${PATH}"

ENV PYTHONPATH="/home/worker/"

CMD ["uwsgi", "--http", "0.0.0.0:5000", "--master", "-p", "4", "-w", "servepages:app"]

EXPOSE 8000/tcp