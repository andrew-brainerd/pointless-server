import chalk from 'chalk';
import { AnyError } from 'mongodb';
import { ApiError, getError } from './error';
const { log } = console;

const isRunningTests = process.env.PORT === '5711';

const info = (message: string, opts = '') => !isRunningTests && log(message, opts)

const cool = (message: string, opts = '') => !isRunningTests && log(chalk.blue(message), opts)

const success = (message: string, opts = '') => !isRunningTests && log(chalk.green(message), opts);

const warn = (message: string, opts = '') => log(chalk.yellow(message), opts);

const error = (message: string, err: ApiError | AnyError, opts = '') =>
  log(chalk.red(`${message}${getError(err)}`), opts)

export default {
  info,
  cool,
  success,
  warn,
  error
};
