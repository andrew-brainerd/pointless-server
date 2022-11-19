import { Request, Response, NextFunction } from 'express';
import { createValidator, ExpressJoiError } from 'express-joi-validation';

export const validator = createValidator({ passError: true })

export const validationErrorHandler = (err: ExpressJoiError, req: Request, res: Response, next: NextFunction) => {
  if (err?.error?.isJoi) {
    res.status(400).json({
      message: err.error.toString()
    });
  } else {
    next(err);
  }
}
