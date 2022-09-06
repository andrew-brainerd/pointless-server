import Pusher from 'pusher';

const appId = process.env.PUSHER_APP_ID as string;
const appKey = process.env.PUSHER_APP_KEY as string;
const appSecret = process.env.PUSHER_APP_SECRET as string;

export const pusher = new Pusher({
  appId,
  key: appKey,
  secret: appSecret,
  cluster: 'us2',
  useTLS: true
});

const PUSH = 'push';
const NOTIFY = 'notify';

export const pushEvents = {
  PUSH,
  NOTIFY
};

const SUCCESS = 'success';

export const pushTypes = {
  SUCCESS
};
