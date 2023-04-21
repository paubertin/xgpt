import { OpenAIApi } from 'openai';
import { Config } from './config';
import { Logger } from './logger';
import nj from '@d4c/numjs';
import argparse from 'argparse';
import { getMemory } from './memory';

const parser = new argparse.ArgumentParser({});

parser.add_argument('-c', '--continuous', { action: 'store_true', help: 'enable continous mode',  });

export async function main () {

  const args = parser.parse_args();
  console.log('args', args, args.continuous);

  Config.init();

  const memory = getMemory();

  // Logger.log('test debug');
  // Logger.info('test info');
  // Logger.trace('test trace');
  // Logger.status('test status');
  // Logger.error('test error');
  // Config.checkOpenAIAPIKey();

  let arr = nj.NdArray.new([[1,2],[3,4],[5,6]], 'float32');

  console.log('arr', arr);
  console.log('size', arr.size);
  console.log('shape', arr.shape);
  
  arr = nj.NdArray.new([1,2,3,4]);

  console.log('arr', arr);
  console.log('size', arr.size);
  console.log('shape', arr.shape);

}