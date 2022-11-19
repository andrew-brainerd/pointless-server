import { User } from '../types/user';
import log from '../utils/log';
import { USERS_COLLECTION } from '../constants/collections';
import { getByProperty, insertOne } from '../utils/data';

export const createUser = async (user: User) => {
  const newUser = await insertOne(USERS_COLLECTION, user) as User;

  log.success(`Created new user ${newUser.name} (${newUser.email})`);

  return newUser;
};

export const getUserByEmail = async (email: string) => {
  return await getByProperty(USERS_COLLECTION, 'email', email) as User;
};

export const getUserByUsername = async (username: string) => {
  log.info('Getting user by username', username);
  return await getByProperty(USERS_COLLECTION, 'username', username) as User;
};
