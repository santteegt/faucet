#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

npm install
cd server && npm install
cd ..
npm run build
docker-compose up -d mongodb
npm run start