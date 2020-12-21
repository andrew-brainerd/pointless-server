const { ObjectID } = require('mongodb');
const data = require('../utils/data');
const log = require('../utils/log');
const { POOLS_COLLECTION } = require('../constants/collections');

const getUserPools = async (page, size, userEmail) => {
  log.cool(`Getting Pools for ${userEmail}`);
  return await data.getSome(
    POOLS_COLLECTION,
    page,
    size,
    'users',
    userEmail,
    { wagers: 0 },
    { poolId: -1 }
  );
};

const getPoolById = async poolId => {
  log.cool(`Getting Pool with ID ${poolId}`);
  return await data.getById(POOLS_COLLECTION, poolId);
};

const createPool = async (name, createdBy, users) => {
  log.cool(`Creating Pool "${name}" for user ${createdBy}`);
  return await data.insertOne(POOLS_COLLECTION, { name, createdBy, users });
};

const addWager = async (poolId, wager) => {
  return await data.addToSet(
    POOLS_COLLECTION,
    poolId, {
    'wagers': {
      _id: new ObjectID(),
      ...wager
    }
  });
};

module.exports = {
  getUserPools,
  getPoolById,
  createPool,
  addWager
};
