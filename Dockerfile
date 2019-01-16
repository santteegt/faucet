FROM node:8-alpine
LABEL maintainer="Ocean Protocol <devops@oceanprotocol.com>"

RUN apk add --no-cache --update\
    bash\
    git\
    g++\
    gcc\
    make\
    cairo-dev\
    python

WORKDIR /app

COPY ./ /app

RUN npm install
RUN cd server && npm install
RUN npm run build

ENTRYPOINT [ "sh", "/app/entrypoint.sh" ]

EXPOSE 3000