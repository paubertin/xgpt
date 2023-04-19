import { OpenAIApi } from 'openai';
import { Config } from './config/config';
import { Logger } from './logger';

export async function main () {
  const config = Config.init();
  Logger.log('test debug');
  Logger.info('test info');
  Logger.trace('test trace');
  Logger.status('test status');
  Logger.error('test error');
  Config.checkOpenAIAPIKey();


}