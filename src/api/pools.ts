import { Router } from 'express';
import {
  acceptWager,
  addUser,
  addWager,
  completeWager,
  createPool,
  deletePool,
  getPoolById,
  getUserPools,
  removeWager,
  transferWinnerPoints
} from '../data/pools';
import { badRequest, created, doesNotExist, serverError, success } from '../utils/statusMessages';
import { validator } from '../utils/validator';
import { getWagerById } from '../utils/pools';
import {
  getUserPoolsQuery,
  defaultPoolParams,
  postPoolBody,
  postUserBody,
  postWagerBody,
  defaultWagerParams,
  patchWagerBody,
  completeWagerBody
} from './validation/pools';

const pools = Router();

pools.get('/', validator.query(getUserPoolsQuery), async (req, res) => {
  const { query: { pageNum, pageSize, userEmail } } = req;
  const page = parseInt(pageNum as string) || 1;
  const size = parseInt(pageSize as string) || 50;

  const { items, totalItems, totalPages } = await getUserPools(page, size, userEmail as string);

  if (!items) return serverError(res, 'Failed to get pools');

  return success(res, {
    items,
    pageNum: page,
    pageSize: size,
    totalItems,
    totalPages
  });
});

pools.get('/:poolId', validator.params(defaultPoolParams), async (req, res) => {
  const { params: { poolId } } = req;

  if (!poolId) {
    return badRequest(res, { message: 'Invalid Pool ID provided' });
  }

  const pool = await getPoolById(poolId as string);

  if (!pool?._id) {
    return doesNotExist(res, 'Pool');
  }

  return success(res, pool);
});

pools.post('/', validator.body(postPoolBody), async (req, res) => {
  const { body: { name, createdBy } } = req;

  const pool = await createPool(name, createdBy, [createdBy]);

  return created(res, pool);
});

pools.delete('/:poolId',
  validator.params(defaultPoolParams), async (req, res) => {
    const { params: { poolId } } = req;

    const deletedPool = await deletePool(poolId);

    return success(res, { deletedPool });
  }
);

pools.post('/:poolId/users',
  validator.params(defaultPoolParams),
  validator.body(postUserBody), async (req, res) => {
    const { params: { poolId }, body: { userEmail } } = req;

    const addedUser = await addUser(poolId, userEmail);

    return created(res, addedUser);
  }
);

pools.post('/:poolId/wagers',
  validator.params(defaultPoolParams),
  validator.body(postWagerBody), async (req, res) => {
    const { params: { poolId }, body: { amount, description, createdBy, users } } = req;

    const pool = await getPoolById(poolId as string);

    if (!pool._id) {
      return doesNotExist(res, 'Pool');
    }

    let hasError = false;
    users.forEach((userEmail: string) => {
      if (!pool.users.includes(userEmail)) {
        hasError = true;
      }
    });

    if (hasError) {
      return badRequest(res, {
        message: 'User is not a member of this pool'
      });
    } else {
      const wager = {
        amount,
        description,
        users,
        isActive: false,
        isComplete: false,
        activeUsers: [createdBy],
        createdBy,
        winners: []
      };
      const addedWager = await addWager(poolId, createdBy, wager);

      return created(res, addedWager);
    }
  }
);

pools.delete('/:poolId/wagers/:wagerId',
  validator.params(defaultWagerParams), async (req, res) => {
    const { params: { poolId, wagerId } } = req;

    const removeResult = await removeWager(poolId, wagerId);

    if ('error' in removeResult) {
      return serverError(res, removeResult.error.message);
    }

    return success(res, { wagerId });
  }
);

pools.patch('/:poolId/wagers/:wagerId/accept',
  validator.params(defaultWagerParams),
  validator.body(patchWagerBody), async (req, res) => {
    const { params: { poolId, wagerId }, body: { userEmail } } = req;

    const pool = await getPoolById(poolId);

    if (!pool._id) {
      return doesNotExist(res, 'Pool');
    }

    const wager = getWagerById(pool, wagerId);

    if (wager._id) {
      const updatedWager = {
        ...wager,
        isActive: true,
        activeUsers: [
          ...wager.activeUsers,
          userEmail
        ]
      };

      const updates = await acceptWager(pool, updatedWager);

      return success(res, { updatedWager: updates });
    }

    return doesNotExist(res, 'Wager', 'pool');
  }
);

pools.patch('/:poolId/wagers/:wagerId/complete',
  validator.params(defaultWagerParams),
  validator.body(completeWagerBody), async (req, res) => {
    const { params: { poolId, wagerId }, body: { completedBy, winners } } = req;

    const pool = await getPoolById(poolId);
    const wager = getWagerById(pool, wagerId);

    if (wager._id) {
      const updatedWager = {
        ...wager,
        isComplete: true,
        winners
      };

      const updates = await completeWager(pool, updatedWager, completedBy);

      await transferWinnerPoints(poolId, winners, wager.amount);

      return success(res, { updatedWager: updates });
    }

    return doesNotExist(res, 'Wager', 'pool');
  }
);

export default pools;
