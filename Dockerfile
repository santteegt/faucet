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

COPY . /app
WORKDIR /app

RUN node --version
RUN python --version
RUN npm install
RUN cd server && npm install
RUN npm run build

CMD [ "npm", "run", "start" ]

EXPOSE 3000