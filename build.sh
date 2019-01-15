#!/bin/bash

rm -rf dist && mkdir dist
npx babel server --out-dir dist --ignore node_modules --copy-files
cd dist && yarn install --production --modules-folder node_modules