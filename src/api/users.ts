import { Router } from 'express';
import {
  createUser,
  getUserByEmail,
  getUserByUsername
} from '../data/users';
import { created, serverError, success } from '../utils/statusMessages';
import { validator } from '../utils/validator';
import { postUserBody, getUserByEmailQuery, getUserByUsernameQuery } from './validation/users';

const users = Router();

users.post('/', validator.body(postUserBody), async (req, res) => {
  const { body: { user } } = req;

  const newUser = await createUser(user);
  if (!newUser) return serverError(res, `Failed to create user [${user}]`);

  return created(res, { ...newUser });
});

users.get('/email', validator.query(getUserByEmailQuery), async (req, res) => {
  const { query: { email } } = req;

  const user = await getUserByEmail(email as string);

  return success(res, { doesNotExist: !user, ...user });
});

users.get('/username', validator.query(getUserByUsernameQuery), async (req, res) => {
  const { query: { username } } = req;

  const user = await getUserByUsername(username as string);

  return success(res, { doesNotExist: !user, ...user });
});

export default users;
