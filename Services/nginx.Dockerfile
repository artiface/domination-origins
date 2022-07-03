FROM alpine:3.16

RUN apk update && apk add nginx openssl && \
    ln -sf /dev/stdout /var/log/nginx/access.log && ln -sf /dev/stderr /var/log/nginx/error.log
COPY ./static /static
COPY ./ReverseProxy/nginx.conf /etc/nginx/nginx.conf

VOLUME /etc/nginx/conf.d

EXPOSE 80 443

ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]