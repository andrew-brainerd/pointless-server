import { ObjectId } from 'mongodb';
import { Pool, Wager } from '../types/pools';

export const getWagerById = (pool: Pool, wagerId: string) => {
  return pool.wagers.find(wager => wager._id === wagerId) as Wager;
};

export const getOtherWagers = (pool: Pool, wagerId: string) => {
  return pool.wagers.filter(wager => !new ObjectId(wager._id).equals(new ObjectId(wagerId))) as Array<Wager>;
};

export const getOtherUsers = (wager: Wager, winningUsers: Array<string>) => {
  return wager.users.filter(userEmail => !winningUsers.includes(userEmail)) as Array<string>;
};
