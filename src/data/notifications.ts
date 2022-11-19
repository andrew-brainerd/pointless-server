import { ObjectId } from 'mongodb';
import { ListResponse } from '../types/data';
import { Notification, NotificationUpdateResponse } from '../types/notifications';
import { getSome, insertOne, updateMany, updateOne } from '../utils/data';
import log from '../utils/log';
import { pusher, pushEvents } from '../utils/pusher';
import { NOTIFICATIONS_COLLECTION } from '../constants/collections';
import { getUserByEmail } from './users';

export const getUserNotifications = async (page: number, size: number, userEmail: string) => {
  log.info(`Getting Notifications for ${userEmail}`);

  const notificationData = await getSome(
    NOTIFICATIONS_COLLECTION,
    page,
    size,
    { userEmail, isDismissed: false },
    {},
    { _id: -1 }
  ) as ListResponse<Notification>;

  const allNotifications = await Promise.all(
    notificationData.items.map(async notification => {
      const user = await getUserByEmail(notification.createdBy);

      return {
        ...notification,
        timestamp: new ObjectId(notification._id).getTimestamp(),
        createdByUser: user
      };
    })).then(notifications => ({
      ...notificationData,
      items: notifications
    }));

  return allNotifications;
};

export const createNotification = async (
  createdBy: string,
  userEmail: string,
  title: string,
  message: string,
  link?: string
) => {
  log.info(`Creating Notification ${{ createdBy, userEmail, title, message, link }}`);

  const newNotification = await insertOne(NOTIFICATIONS_COLLECTION, {
    createdBy, userEmail, title, message, link, isRead: false, isDismissed: false
  });

  pusher.trigger(userEmail, pushEvents.NOTIFY, newNotification);

  return newNotification;
};

export const markAllAsRead = async (userEmail: string) => {
  log.info(`Marking all notifications for ${userEmail} as read`);

  return updateMany(NOTIFICATIONS_COLLECTION,
    { userEmail },
    { $set: { isRead: true } }
  ) as Promise<NotificationUpdateResponse>;
};

export const markAsRead = async (userEmail: string, notificationId: string) => {
  log.info(`Marking notification for ${userEmail} as read`, notificationId);

  return await updateOne(NOTIFICATIONS_COLLECTION, notificationId, {
    isRead: true
  }) as Promise<NotificationUpdateResponse>;
};

export const dismiss = async (userEmail: string, notificationId: string) => {
  log.info(`Dismissing notification for ${userEmail}`, notificationId);

  return await updateOne(NOTIFICATIONS_COLLECTION, notificationId, {
    isDismissed: true
  }) as Promise<NotificationUpdateResponse>;
};

