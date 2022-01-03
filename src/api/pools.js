const pools = require('express').Router();
const poolsData = require('../data/pools');
const status = require('../utils/statusMessages');
const { validator } = require('../utils/validator');
const { getWagerById } = require('../utils/pools');
const {
  getUserPoolsQuery,
  defaultPoolParams,
  postPoolBody,
  postUserBody,
  postWagerBody,
  defaultWagerParams,
  patchWagerBody,
  completeWagerBody
} = require('./validation/pools');

pools.get('/', validator.query(getUserPoolsQuery), async (req, res) => {
  const { query: { pageNum, pageSize, userEmail } } = req;
  const page = parseInt(pageNum) || 1;
  const size = parseInt(pageSize) || 50;

  const { items, totalItems, totalPages } = await poolsData.getUserPools(page, size, userEmail);

  if (!items) return status.serverError(res, 'Failed', 'Failed to get pools');

  return status.success(res, {
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
    return status.badRequest(res, { message: 'Invalid Pool ID provided' });
  }

  const pool = await poolsData.getPoolById(poolId);

  return status.success(res, { ...pool });
});

pools.post('/', validator.body(postPoolBody), async (req, res) => {
  const { body: { name, createdBy } } = req;

  const pool = await poolsData.createPool(name, createdBy, [createdBy]);

  return status.created(res, { ...pool });
});

pools.delete('/:poolId',
  validator.params(defaultPoolParams), async (req, res) => {
    const { params: { poolId } } = req;

    const deletedPool = await poolsData.deletePool(poolId);

    return status.success(res, { deletedPool });
  }
);

pools.post('/:poolId/users',
  validator.params(defaultPoolParams),
  validator.body(postUserBody), async (req, res) => {
    const { params: { poolId }, body: { userEmail } } = req;

    const addedUser = await poolsData.addUser(poolId, userEmail);

    return status.created(res, { ...addedUser });
  }
);

pools.post('/:poolId/wagers',
  validator.params(defaultPoolParams),
  validator.body(postWagerBody), async (req, res) => {
    const { params: { poolId }, body: { amount, description, createdBy, users } } = req;

    const pool = await poolsData.getPoolById(poolId);

    let hasError = false;
    users.forEach(userEmail => {
      if (!pool.users.includes(userEmail)) {
        hasError = true;
      }
    });

    if (hasError) {
      return status.badRequest(res, {
        message: 'User is not a member of this pool'
      });
    } else {
      const addedWager = await poolsData.addWager(poolId, createdBy, {
        amount,
        description,
        users,
        isActive: false,
        isComplete: false,
        activeUsers: [createdBy]
      });

      return status.created(res, { ...addedWager });
    }
  }
);

pools.delete('/:poolId/wagers/:wagerId',
  validator.params(defaultWagerParams), async (req, res) => {
    const { params: { poolId, wagerId } } = req;

    const removedWager = await poolsData.removeWager(poolId, wagerId);

    return status.success(res, { ...removedWager });
  }
);

pools.patch('/:poolId/wagers/:wagerId/accept',
  validator.params(defaultWagerParams),
  validator.body(patchWagerBody), async (req, res) => {
    const { params: { poolId, wagerId }, body: { userEmail } } = req;

    const pool = await poolsData.getPoolById(poolId);
    const wager = getWagerById(pool, wagerId);

    if (!!wager) {
      const updatedWager = {
        ...wager,
        isActive: true,
        activeUsers: [
          ...wager.activeUsers,
          userEmail
        ]
      };

      const updates = await poolsData.acceptWager(pool, updatedWager);

      return status.success(res, { updatedWager: updates });
    }

    return status.doesNotExist(res, 'Wager', 'wagers', 'pool');
  }
);

pools.patch('/:poolId/wagers/:wagerId/complete',
  validator.params(defaultWagerParams),
  validator.body(completeWagerBody), async (req, res) => {
    const { params: { poolId, wagerId }, body: { completedBy, winners } } = req;

    const pool = await poolsData.getPoolById(poolId);
    const wager = getWagerById(pool, wagerId);

    if (!!wager) {
      const updatedWager = {
        ...wager,
        isComplete: true,
        winners
      };

      const updates = await poolsData.completeWager(pool, updatedWager, completedBy);

      await poolsData.transferWinnerPoints(poolId, winners, wager.amount);

      return status.success(res, { updatedWager: updates });
    }

    return status.doesNotExist(res, 'Wager', 'wagers', 'pool');
  }
);

module.exports = pools;
