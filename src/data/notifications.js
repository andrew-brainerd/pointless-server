const { ObjectID } = require('mongodb');
const data = require('../utils/data');
const log = require('../utils/log');
const { pusher, pushEvents } = require('../utils/pusher');
const { NOTIFICATIONS_COLLECTION } = require('../constants/collections');
const { getUserByEmail } = require('./users');

const getUserNotifications = async (page, size, userEmail) => {
  log.cool(`Getting Notifications for ${userEmail}`);

  const notificationData = await data.getSome(
    NOTIFICATIONS_COLLECTION,
    page,
    size,
    { userEmail, isDismissed: false },
    {},
    { _id: -1 }
  );

  const allNotifications = await Promise.all(notificationData.items.map(async notification => {
    const user = await getUserByEmail(notification.createdBy);

    return {
      ...notification,
      timestamp: ObjectID(notification._id).getTimestamp(),
      createdByUser: user
    };
  })).then(notifications => ({
    ...notificationData,
    items: notifications
  }));

  return allNotifications;
};

const createNotification = async (createdBy, userEmail, title, message, link) => {
  log.cool(`Creating Notification`, { createdBy, userEmail, title, message, link });

  const newNotification = await data.insertOne(NOTIFICATIONS_COLLECTION, {
    createdBy, userEmail, title, message, link, isRead: false, isDismissed: false
  });

  pusher.trigger(userEmail, pushEvents.NOTIFY, newNotification);

  return newNotification;
};

const markAllAsRead = async userEmail => {
  log.cool(`Marking all notifications for ${userEmail} as read`);

  await data.updateMany(NOTIFICATIONS_COLLECTION,
    { userEmail },
    { $set: { isRead: true } }
  );
};

const markAsRead = async (userEmail, notificationId) => {
  log.cool(`Marking notification for ${userEmail} as read`, notificationId);

  await data.updateOne(NOTIFICATIONS_COLLECTION, notificationId, {
    isRead: true
  });
};

const dismiss = async (userEmail, notificationId) => {
  log.cool(`Dismissing notification for ${userEmail}`, notificationId);

  await data.updateOne(NOTIFICATIONS_COLLECTION, notificationId, {
    isDismissed: true
  });
};

module.exports = {
  getUserNotifications,
  createNotification,
  markAllAsRead,
  markAsRead,
  dismiss
};
