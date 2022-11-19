import { Response } from 'express';
import {
  SUCCESS,
  CREATED,
  BAD_REQUEST,
  DOES_NOT_EXIST,
  CONFLICT,
  SERVER_ERROR
} from '../constants/responseCodes';

export const success = <T>(res: Response, body: T) => res.status(SUCCESS).send(body);

export const created = <T>(res: Response, body: T) => res.status(CREATED).send(body);

export const badRequest = <T>(res: Response, body: T) => res.status(BAD_REQUEST).send(body);

export const doesNotExist = (res: Response, property: string, container?: string) =>
  res.status(DOES_NOT_EXIST).send({
    message: `${property} does not exist${container ? ` in ${container}` : ''}`
  });

export const alreadyExists = (res: Response, type: string, property: string, value: string, container: string) =>
  res.status(CONFLICT).send({
    message: `${type} with ${property} [${value}] already exists${container ? ` in ${container}` : ''}`
  });

export const serverError = (res: Response, message: string) => res.status(SERVER_ERROR).send({ message });

