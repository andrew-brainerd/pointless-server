import { User } from './user'

export interface Notification {
  _id: string,
  createdBy: string,
  createdByUser: User,
  isDismissed: boolean,
  isRead: boolean,
  link: string,
  message: string,
  timestamp: string,
  title: string,
  userEmail: string
}

export interface NotificationRequest {
  userEmail: string,
  notificationId: string,
  showLoading?: boolean
}

export interface NotificationsRequest {
  userEmail: string,
  showLoading?: boolean
}

export interface NotificationsUpdateResponse {
  didUpdateAll: boolean,
  didUpdateSome: boolean
}

export interface NotificationUpdateResponse {
  id: string,
  didUpdate: boolean
}
