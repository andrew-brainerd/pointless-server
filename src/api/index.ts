import express, { Request, Response } from 'express';
import { appInfo } from '../server';
import notifications from './notifications';
import pools from './pools';
import users from './users';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.send({
    message: `Welcome to the Pointless API v${appInfo.version}!`
  });
});

router.use('/notifications', notifications);
router.use('/pools', pools);
router.use('/users', users);

export default router;
