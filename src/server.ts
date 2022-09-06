/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
import express, { NextFunction, Request, Response } from 'express';
import log from './utils/log';
import api from './api';
import { validationErrorHandler } from './utils/validator';

const appInfo = require('../package.json');
const port = process.env.PORT ?? 5000;
const app = express();

app.use(express.json({ limit: '15mb'}));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use('/api', api);

app.use(validationErrorHandler);

app.listen(port, () => {
  log.cool(`Pointless API v${appInfo.version}`);
  log.info(`Listening on port ${port}`);
});

export { appInfo }
