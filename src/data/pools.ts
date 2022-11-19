import { ListResponse, PointlessError } from '../types/data';
import { Pool, Wager } from '../types/pools';
import { ObjectId } from 'mongodb';
import { addToSet, deleteOne, getById, getSome, insertOne, pullFromSet, updateOne } from '../utils/data';
import log from '../utils/log';
import { getOtherWagers, getWagerById } from '../utils/pools';
import { pusher, pushEvents, pushTypes } from '../utils/pusher';
import { POOLS_COLLECTION } from '../constants/collections';
import { createNotification } from './notifications';
import { getUserByEmail } from './users';

export const getUserPools = async (page: number, size: number, userEmail: string) => {
  log.info(`Getting Pools for ${userEmail}`);
  return await getSome(
    POOLS_COLLECTION,
    page,
    size,
    { users: userEmail },
    { wagers: 0 },
    { poolId: -1 }
  ) as ListResponse<Pool>;
};

export const getPoolById = async (poolId: string): Promise<Pool> => {
  log.info(`Getting Pool with ID ${poolId}`);
  return await getById(POOLS_COLLECTION, poolId) as Pool;
};

export const createPool = async (name: string, createdBy: string, users: Array<string>, startingPoints = 500) => {
  log.info(`Creating Pool '${name}' for user ${createdBy}`);

  const user = await getUserByEmail(createdBy);
  const userId = user._id ? new ObjectId(user._id).toString() : '-1';

  const pool = {
    name,
    createdBy,
    users,
    minimumBet: 5,
    config: {
      startingPoints
    },
    pointTotals: {
      [userId]: startingPoints
    },
    pendingPoints: {
      [userId]: 0
    }
  };

  await insertOne(POOLS_COLLECTION, pool);

  return pool;
};

export const deletePool = async (poolId: string) => {
  log.info(`Deleting Pool ${poolId}`);
  return await deleteOne(POOLS_COLLECTION, poolId);
};

export const addUser = async (poolId: string, userEmail: string) => {
  log.info(`Adding User ${userEmail} to pool ${poolId}`);

  const pool = await getPoolById(poolId);

  if (!pool?._id) {
    return { error: { message: `Pool ${poolId} does not exist` } } as PointlessError;
  }

  const user = await getUserByEmail(userEmail);
  const userId = user._id ? new ObjectId(user._id).toString() : '-1';

  const userPoints = {
    pointTotals: {
      ...pool.pointTotals,
      [userId]: pool.startingPoints
    },
    pendingPoints: {
      ...pool.pendingPoints,
      [userId]: 0
    }
  };

  await addToSet(POOLS_COLLECTION, poolId, 'users', userEmail);

  await updateOne(POOLS_COLLECTION, poolId, userPoints);

  pool.users.map(poolUser => {
    if (poolUser !== userEmail) {
      const title = 'New Pool Member';
      const message = `<i>${userEmail}</i> joined <i>${pool.name}</i> pool`;

      pusher.trigger(poolUser, pushEvents.PUSH, { category: pushTypes.SUCCESS, title, message });

      createNotification(userEmail, poolUser, title, message);
    }
  });

  return user;
};

export const addWager = async (poolId: string, createdBy: string, wager: Wager): Promise<Wager> => {
  log.info(`Adding Wager to pool ${poolId}\n${wager}`);

  const newWager: Wager = {
    ...wager,
    _id: new ObjectId().toString(),
    createdBy
  };

  const addToSetResult = await addToSet(POOLS_COLLECTION, poolId, 'wagers', newWager);

  await subtractUserPoints(poolId, createdBy, wager.amount);

  wager.users.forEach(userEmail => {
    pusher.trigger(userEmail, pushEvents.PUSH, {
      category: pushTypes.SUCCESS,
      title: 'Wager Created',
      message: userEmail === createdBy ? `Successfully created wager` : `New wager created by ${createdBy}`
    });

    if (userEmail !== createdBy) {
      createNotification(
        createdBy,
        userEmail,
        'Wager Created',
        `${createdBy} wants to bet you ${wager.amount} pts`,
        `${process.env.FRONTEND_URL}/pools/${poolId}/wagers/${addToSetResult.item._id}`
      );
    }
  });3


  return newWager;
};

export const removeWager = async (poolId: string, wagerId: string) => {
  log.info(`Removing Wager ${wagerId} from pool ${poolId}`);

  const pool = await getPoolById(poolId);

  if (!pool?._id) {
    return { error: { message: `Pool ${poolId} does not exist` } } as PointlessError;
  }

  const wager = await getWagerById(pool, wagerId) as Wager;

  await Promise.all(wager.users.map(async userEmail => {
    await addUserPoints(poolId, userEmail, wager.amount);
  }));

  return await pullFromSet(POOLS_COLLECTION, poolId, 'wagers', wagerId);
};

export const acceptWager = async (pool: Pool, updatedWager: Wager) => {
  log.info(`Accepting Wager ${updatedWager._id} in pool ${pool._id}`);

  const updatedWagers = [
    ...getOtherWagers(pool, updatedWager._id as string),
    updatedWager
  ];

  pusher.trigger(updatedWager.createdBy, pushEvents.PUSH, {
    category: pushTypes.SUCCESS,
    title: 'Wager Accepted',
    message: `Your wager was accepted`
  });

  createNotification(
    updatedWager.createdBy,
    updatedWager.createdBy,
    'Wager Accepted',
    `Your wager for ${updatedWager.amount} pts was accepted`,
    `${process.env.FRONTEND_URL}/pools/${pool._id}/wagers/${updatedWager._id}`
  );

  return await updateOne(POOLS_COLLECTION, pool._id, { wagers: updatedWagers });
};

export const completeWager = async (pool: Pool, updatedWager: Wager, completedBy: string) => {
  log.info(`Completing Wager ${updatedWager._id} in pool ${pool._id}`);

  const updatedWagers = [
    ...getOtherWagers(pool, updatedWager._id as string),
    updatedWager
  ];

  updatedWager.users.forEach(userEmail => {
    if (userEmail !== completedBy) {
      pusher.trigger(userEmail, pushEvents.PUSH, {
        category: pushTypes.SUCCESS,
        title: 'Wager Comleted',
        message: 'Your wager has been marked as complete'
      });

      createNotification(
        completedBy,
        userEmail,
        'Wager Complete',
        `${completedBy} says your wager for ${updatedWager.amount} is complete`,
        `${process.env.FRONTEND_URL}/pools/${pool._id}/wagers/${updatedWager._id}`
      );
    }
  });

  return await updateOne(POOLS_COLLECTION, pool._id, { wagers: updatedWagers });
};

export const updateUserPoints = async (poolId: string, userEmail: string, points: number) => {
  log.info(`Updating user ${userEmail} points ${points}`);

  const pool = await getPoolById(poolId);
  const user = await getUserByEmail(userEmail);
  const userId = user._id ? new ObjectId(user._id).toString() : '-1';

  const updatedPointTotals = {
    pointTotals: {
      ...pool.pointTotals,
      [userId]: pool.pointTotals[userId] + points
    }
  };

  return await updateOne(POOLS_COLLECTION, poolId, updatedPointTotals);
};

export const updatePendingPoints = async (poolId: string, userEmail: string, points: number) => {
  log.info(`Updating user ${userEmail} pending points ${points}`);

  const pool = await getPoolById(poolId);
  const user = await getUserByEmail(userEmail);
  const userId = user._id ? new ObjectId(user._id).toString() : '-1';

  const updatedPendingPoints = {
    pendingPoints: {
      ...pool.pendingPoints,
      [userId]: pool.pendingPoints[userId] + points
    }
  };

  return await updateOne(POOLS_COLLECTION, poolId, updatedPendingPoints);
};

export const addUserPoints = async (poolId: string, userEmail: string, points: number) => {
  return Promise.all([
    updateUserPoints(poolId, userEmail, points),
    subtractPendingPoints(poolId, userEmail, points)
  ]);
};

export const subtractUserPoints = async (poolId: string, userEmail: string, points: number) => {
  return Promise.all([
    updateUserPoints(poolId, userEmail, -1 * points),
    addPendingPoints(poolId, userEmail, points)
  ]);
};

export const addPendingPoints = async (poolId: string, userEmail: string, points: number) => {
  await updatePendingPoints(poolId, userEmail, points);
};

export const subtractPendingPoints = async (poolId: string, userEmail: string, points: number) => {
  await updatePendingPoints(poolId, userEmail, -1 * points);
};

export const transferWinnerPoints = async (poolId: string, winners: Array<string>, points: number) => {
  await Promise.all(winners.map(async winnerEmail => {
    await addUserPoints(poolId, winnerEmail, points);
  }));
};
