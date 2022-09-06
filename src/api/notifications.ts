import { Router } from 'express';
import emailClient from '@sendgrid/mail';
import {
  dismiss,
  getUserNotifications,
  markAllAsRead,
  markAsRead
} from '../data/notifications';
import { getInviteHtml } from '../utils/invitation';
import { created, serverError, success } from '../utils/statusMessages';
import { validator } from '../utils/validator';
import {
  getUserNotificationsQuery,
  postInvitationBody,
  defaultNotificationParams,
  patchNotificationBody
} from './validation/notifications';

const notifications = Router();

notifications.get('/', validator.query(getUserNotificationsQuery), async (req, res) => {
  const { query: { pageNum, pageSize, userEmail } } = req;
  const page = parseInt(pageNum as string) || 1;
  const size = parseInt(pageSize as string) || 50;

  const { items, totalItems, totalPages } = await getUserNotifications(page, size, userEmail as string);

  if (!items) return serverError(res, 'Failed to get notifications');

  return success(res, {
    items,
    pageNum: page,
    pageSize: size,
    totalItems,
    totalPages
  });
});

notifications.post('/invitation', validator.body(postInvitationBody), async (req, res) => {
  const { body: { to, poolId, location } } = req;

  const from = 'Pointless <andrew@brainerd.dev>';
  const subject = 'You have been invited to a Pointless pool';
  const text = 'We bet you will have a lot of fun joining this pool';
  const html = getInviteHtml(poolId, location);

  emailClient.setApiKey(process.env.SENDGRID_API_KEY as string);
  emailClient
    .send({ to, from, subject, text, html })
    .then(() => {
      console.log('Email sent ', { to, from, subject, text });
    }, error => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body)
      }
    });

  return created(res, to);
});

notifications.patch('/readAll', validator.body(patchNotificationBody), async (req, res) => {
  const { body: { userEmail } } = req;

  const notificationsUpdate = await markAllAsRead(userEmail);

  return success(res, notificationsUpdate);
});

notifications.patch('/:notificationId/read',
  validator.params(defaultNotificationParams),
  validator.body(patchNotificationBody),
  async (req, res) => {
    const { params: { notificationId }, body: { userEmail } } = req;

    const notificationUpdate = await markAsRead(userEmail, notificationId);

    return success(res, notificationUpdate);
  }
);

notifications.patch('/:notificationId/dismiss',
  validator.params(defaultNotificationParams),
  validator.body(patchNotificationBody),
  async (req, res) => {
    const { params: { notificationId }, body: { userEmail } } = req;

    const notificationUpdate = await dismiss(userEmail, notificationId);

    return success(res, notificationUpdate);
  }
);

export default notifications;
