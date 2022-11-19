import Joi from 'joi';

export const getUserNotificationsQuery = Joi.object({
  pageNum: Joi.number(),
  pageSize: Joi.number(),
  userEmail: Joi.string().required()
});

export const postInvitationBody = Joi.object({
  to: Joi.string().required(),
  poolId: Joi.string().required(),
  location: Joi.object()
});

export const defaultNotificationParams = Joi.object({
  notificationId: Joi.string().required()
});

export const patchNotificationBody = Joi.object({
  userEmail: Joi.string().required()
});

