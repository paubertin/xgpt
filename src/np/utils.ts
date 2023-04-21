import _, { RecursiveArray } from 'lodash';
import DTYPES from './types';

export function isNumber (value: any): value is number {
  return typeof value === 'number';
}

export function isString (value: any): value is string {
  return typeof value === 'string';
}

export function isFunction (value: any) {
  return typeof value === 'function';
}

export function isBuffer (value: any): value is Buffer {
  return value !== null && value.constructor !== null
    && typeof value.constructor.isBuffer === 'function'
    && value.constructor.isBuffer(value);
}

export function iota (n: number) {
  const result = new Array<number>(n);
  for (let i = 0; i < n; ++i) {
    result[i] = i;
  }
  return result;
}

export function flatten (array: any[], isDeep: boolean, result: any[] = []) {
  let index = -1;
  const length = array.length;

  while (++index < length) {
    const value = array[index];
    if (isNumber(value)) {
      result[result.length] = value;
    }
    else if (isDeep) {
      // Recursively flatten arrays (susceptible to call stack limits).
      flatten(value, isDeep, result);
    }
    else {
      result.push(value);
    }
  }

  return result;
}

export function shapeSize (shape: number[]) {
  let s = 1;
  for (let i = 0; i < shape.length; i++) {
    s *= shape[i];
  }
  return s;
}

export function isKeyOf<T extends object> (key: any, obj: T): key is keyof T {
  if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'symbol') return false;
  return key in obj;
}

export function getType (dType: any) {
  return isFunction(dType) ? dType : (isKeyOf(dType, DTYPES) ? DTYPES[dType] : Array);
}

function _dim (x: any) {
  const ret: number[] = [];
  while (typeof x === 'object') {
    ret.push(x.length);
    x = x[0];
  }
  return ret;
}

export function getShape (array: number | RecursiveArray<number>): number[] {
  let y, z;
  if (typeof array === 'object') {
    y = array[0];
    if (typeof y === 'object') {
      z = y[0];
      if (typeof z === 'object') {
        return _dim(array);
      }
      return [ array.length, y.length ];
    }
    return [ array.length ];
  }
  return [];
}

export const defaults = _.defaults;
