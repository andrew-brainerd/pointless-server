import Joi from 'joi';

export const getUserPoolsQuery = Joi.object({
  pageNum: Joi.number(),
  pageSize: Joi.number(),
  userEmail: Joi.string().required()
});

export const defaultPoolParams = Joi.object({
  poolId: Joi.string().required()
});

export const postPoolBody = Joi.object({
  name: Joi.string().required(),
  createdBy: Joi.string().required()
});

export const postUserBody = Joi.object({
  userEmail: Joi.string().required()
});

export const postWagerBody = Joi.object({
  amount: Joi.number().required(),
  description: Joi.string().required(),
  createdBy: Joi.string().required(),
  users: Joi.array().required()
});

export const defaultWagerParams = Joi.object({
  poolId: Joi.string().required(),
  wagerId: Joi.string().required()
});

export const patchWagerBody = Joi.object({
  userEmail: Joi.string().required()
});

export const completeWagerBody = Joi.object({
  completedBy: Joi.string().required(),
  winners: Joi.array().required()
});
