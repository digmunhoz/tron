FROM        python:3.13-slim

ARG         DIR=/app

ARG         VERSION
ENV         VERSION=${VERSION}
WORKDIR     $DIR

RUN         apt update && apt-get install -y make gcc libffi-dev libpq-dev libldap2-dev libsasl2-dev
RUN         pip install --upgrade pip
RUN         pip install --no-cache-dir poetry

COPY        requirements.txt /tmp/

RUN         pip install --upgrade pip \
                && pip install -r /tmp/requirements.txt

ADD         . $DIR/
EXPOSE      80

CMD         ["python", "manage.py", "runserver", "--insecure", "0.0.0.0:80"]
