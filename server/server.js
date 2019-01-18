import path from 'path';
require('dotenv').config({path: path.join(__dirname, '/.env')})
import fs from 'fs';
import express from 'express';
import expressValidator from 'express-validator';
import cors from 'cors';
import bodyParser from 'body-parser';
import requestIp from 'request-ip';
import net from 'net';
import { Ocean, Logger } from '@oceanprotocol/squid';
import config from './config';
import logger from './utils/logger';
// import winston from 'winston';
// import expressWinston from 'express-winston';
// import winstonPapertrail from 'winston-papertrail';

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(requestIp.mw())
app.use(expressValidator())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
// set path for static assets
app.use(express.static(path.join(__dirname, 'public')))

Ocean.getInstance(config.oceanConfig).then((ocean) => {

  logger.info('Server is successfully connected to Ocean Protocol')

  app.listen(config.server.port, err => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }

    require('./utils/db');

    fs.readdirSync(path.join(__dirname, 'routes')).map(file => {
      require('./routes/' + file)(app, ocean);
    });

    logger.info(
      `Ocean Faucet server is now running on port ${config.server.port} in ${config.env} mode`
    );
  });
}).catch((error) => {
  logger.error(`Error when trying to connect to Ocean Protocol: ${error}`)
  process.exit(1);
});

module.exports = app;