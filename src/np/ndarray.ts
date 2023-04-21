import { RecursiveArray } from "lodash";
import { ValueError } from "./errors";
import { flatten, getShape, getType, isNumber, shapeSize } from "./utils";
import ndarray from 'ndarray';
import matrixProduct from 'ndarray-gemm';

import cwise from 'cwise';

function createArray (arr: any, dtype?: ndarray.DataType) {
  if (arr instanceof NdArray) { return arr; }
  const T = getType(dtype);
  if (isNumber(arr)) {
    if (T !== Array) {
      return new NdArray(new T([arr]), [1]);
    }
    else {
      return new NdArray([arr], [1]);
    }
  }
  const shape = getShape(arr);
  if (shape.length > 1) {
    arr = flatten(arr, true);
  }
  if (!(arr instanceof T)) {
    arr = new T(arr);
  }
  return new NdArray(arr, shape);
}

class NdArrayIterator<T> implements Iterator<T> {
  private index: number = 0;
  private done: boolean = false;

  public constructor (private values: T[]) {}

  public next (): IteratorResult<T> {
    if (this.done) {
      return {
        done: this.done,
        value: undefined,
      };
    }
    if (this.index === this.values.length) {
      this.done = true;
      return {
        done: this.done,
        value: this.index,
      }
    }
    const value = this.values[this.index];
    this.index += 1;
    return {
      done: false,
      value,
    };
  }
}


/**
 * Multidimensional, homogeneous array of fixed-size items
 * 
* The number of dimensions and items in an array is defined by its shape, which is a tuple of N positive
* integers that specify the sizes of each dimension. The type of items in the array is specified by a separate
* data-type object (dtype), one of which is associated with each NdArray.
 */
export class NdArray <D extends ndarray.Data = ndarray.Data<number>> implements Iterable<any> {
  private selection: ndarray.NdArray<D>;

  public constructor (data: ndarray.NdArray<D>);
  public constructor (data: D, shape: Array<number>, stride?: Array<number>, offset?: number);
  public constructor (data: D | ndarray.NdArray<D>, shape?: Array<number>, stride?: Array<number>, offset?: number) {
    if (shape === undefined) {
      this.selection = data as ndarray.NdArray<D>;
    }
    else {
      this.selection = ndarray(data as D, shape, stride, offset);
    }
  }

  [Symbol.iterator](): Iterator<any, any, undefined> {
    throw new Error();
    // return new NdArrayIterator(this.selection);
  }

  public static new = createArray;

  /**
   * Number of elements in the array.
   */
  public get size (): number {
    return this.selection.size;
  }

  /**
   * The shape of the array
   */
  public get shape (): number[] {
    return this.selection.shape;
  }

  /**
   * Number of array dimensions.
   */
  public get ndim () {
    return this.selection.shape.length;
  }

  /**
   * Data-type of the array’s elements.
   */
  public get dtype () {
    return this.selection.dtype;
  }

  public set dtype (dtype: ndarray.DataType<D>) {
    const T = getType(dtype);
    if (T !== getType(this.dtype)) {
      this.selection = ndarray(new T(this.selection.data), this.selection.shape, this.selection.stride, this.selection.offset);
    }
  }

  /**
   * Permute the dimensions of the array.
   */
  public get T () {
    return this.transpose();
  }

  public get (...args: number[]) {
    const n = args.length;
    for (let i = 0; i < n; i++) {
      if (args[i] < 0) {
        args[i] += this.shape[i];
      }
    }
    return this.selection.get(...args);
  }

  public set (...args: number[]) {
    this.selection.set(...args);
  }

  public slice (...args: any[]) {
    const d = this.ndim;
    const hi = new Array<number | null>(d);
    const lo = new Array<number>(d);
    const step = new Array<number>(d);
    const tShape = this.shape;
  
    for (let i = 0; i < d; i++) {
      const arg = args[i];
      if (typeof arg === 'undefined') { break; }
      if (arg === null) { continue; }
      if (isNumber(arg)) {
        lo[i] = (arg < 0) ? arg + tShape[i] : arg;
        hi[i] = null;
        step[i] = 1;
      }
      else if (arg.length === 4 && arg[1] === null && arg[2] === null) {
        // pattern: a[start::step]
        const s = (arg[0] < 0) ? arg[0] + tShape[i] : arg[0];
        lo[i] = s;
        hi[i] = null;
        step[i] = arg[3] || 1;
      }
      else {
        // pattern start:end:step
        const start = (arg[0] < 0) ? arg[0] + tShape[i] : arg[0];
        const end = (arg[1] < 0) ? arg[1] + tShape[i] : arg[1];
        lo[i] = end ? start : 0;
        hi[i] = end ? end - start : start;
        step[i] = arg[2] || 1;
      }
    }
  
    const slo = this.selection.lo(...lo);
    const shi = slo.hi(...hi);
    const sstep = shi.step(...step);
    return new NdArray(sstep);
  }

  /**
   * Return a subarray by fixing a particular axis
   */
  public pick (...axis: (number|null)[]) {
    return new NdArray(this.selection.pick(...axis));
  }

  /**
   * Return a shifted view of the array. Think of it as taking the upper left corner of the image and dragging it inward
   */
  public lo (...args: number[]) {
    return new NdArray(this.selection.lo(...args));
  }

  /**
   * Return a sliced view of the array.
   */
  public hi (...args: number[]) {
    return new NdArray(this.selection.hi(...args));
  }

  public step (...args: number[]) {
    return new NdArray(this.selection.step(...args));
  }

  /**
   * Return a copy of the array collapsed into one dimension using row-major order (C-style)
   */
  public flatten () {
    if (this.ndim === 1) { // already flattened
      return new NdArray(this.selection);
    }
    const T = getType(this.dtype);
    let arr = flatten(this.tolist(), true);
    if (!(arr instanceof T)) {
      arr = new T(arr);
    }
    return new NdArray(arr, [this.size]);
  }

  /**
   * Gives a new shape to the array without changing its data.
   * @param shape The new shape should be compatible with the original shape. If an integer, then the result will be a 1-D array of that length. One shape dimension can be -1. In this case, the value is inferred from the length of the array and remaining dimensions.
   */
  public reshape (shape: number | number[]): NdArray {
    if (isNumber(shape) && shape === -1) {
      shape = [ shapeSize(this.shape) ];
    }
    if (isNumber(shape)) {
      shape = [shape];
    }
    if (shape.filter((s) => s === -1).length > 1) {
      throw new ValueError('can only specify one unknown dimension');
    }
    const currentShapeSize = shapeSize(shape);
    shape = shape.map((s) => { return s === -1 ? -1 * this.size / currentShapeSize : s; });
    if (this.size !== shapeSize(shape)) {
      throw new ValueError('total size of new array must be unchanged');
    }
    const selfShape = this.selection.shape;
    const selfOffset = this.selection.offset;
    const selfStride = this.selection.stride;
    const selfDim = selfShape.length;
    const d = shape.length;
    let stride;
    let offset;
    let i;
    let sz;
    if (selfDim === d) {
      var sameShapes = true;
      for (i = 0; i < d; ++i) {
        if (selfShape[i] !== shape[i]) {
          sameShapes = false;
          break;
        }
      }
      if (sameShapes) {
        return new NdArray(this.selection.data, selfShape, selfStride, selfOffset);
      }
    }
    else if (selfDim === 1) {
      // 1d view
      stride = new Array(d);
      for (i = d - 1, sz = 1; i >= 0; --i) {
        stride[i] = sz;
        sz *= shape[i];
      }
      offset = selfOffset;
      for (i = 0; i < d; ++i) {
        if (stride[i] < 0) {
          offset -= (shape[i] - 1) * stride[i];
        }
      }
      return new NdArray(this.selection.data, shape, stride, offset);
    }
  
    const minDim = Math.min(selfDim, d);
    let areCompatible = true;
    for (i = 0; i < minDim; i++) {
      if (selfShape[i] !== shape[i]) {
        areCompatible = false;
        break;
      }
    }
    if (areCompatible) {
      stride = new Array(d);
      for (i = 0; i < d; i++) {
        stride[i] = selfStride[i] || 1;
      }
      offset = selfOffset;
      return new NdArray(this.selection.data, shape, stride, offset);
    }
    return this.flatten().reshape(shape);
  }

  /**
   * Permute the dimensions of the array.
   */
  public transpose (...axes: number[]) {
    if (axes.length === 0) {
      const d = this.ndim;
      axes = new Array(d);
      for (var i = 0; i < d; i++) {
        axes[i] = d - i - 1;
      }
    }
    return new NdArray(this.selection.transpose(...axes));
  }

  /**
   * Dot product of two arrays.
   */
  public dot (x: RecursiveArray<number> | NdArray): NdArray {
    x = (x instanceof NdArray) ? x : createArray(x, this.dtype);
    const tShape = this.shape;
    const xShape = x.shape;
  
    if (tShape.length === 2 && xShape.length === 2 && tShape[1] === xShape[0]) { // matrix/matrix
      const T = getType(this.dtype);
      const c = new NdArray(new T(tShape[0] * xShape[1]), [tShape[0], xShape[1]]);
      matrixProduct(c.selection, this.selection, x.selection);
      return c;
    }
    else if (tShape.length === 1 && xShape.length === 2 && tShape[0] === xShape[0]) { // vector/matrix
      return this.reshape([tShape[0], 1]).T.dot(x).reshape(xShape[1]);
    }
    else if (tShape.length === 2 && xShape.length === 1 && tShape[1] === xShape[0]) { // matrix/vector
      return this.dot(x.reshape([xShape[0], 1])).reshape(tShape[0]);
    }
    else if (tShape.length === 1 && xShape.length === 1 && tShape[0] === xShape[0]) { // vector/vector
      return this.reshape([tShape[0], 1]).T.dot(x.reshape([xShape[0], 1])).reshape([1]);
    }
    else {
      throw new ValueError('cannot compute the matrix product of given arrays');
    }
  }

  public toList () {
    return unpackArray(this.selection);
  }
}

function initNativeArray (shape: number[], i: number = 0) {
  const c = shape[i] | 0;
  if (c <= 0) { return []; }
  const result: RecursiveArray<number> = new Array(c);
  let j;
  if (i === shape.length - 1) {
    for (j = 0; j < c; ++j) {
      result[j] = 0;
    }
  }
  else {
    for (j = 0; j < c; ++j) {
      result[j] = initNativeArray(shape, i + 1);
    }
  }
  return result;
}

const doUnpack = cwise({
  args: ['array', 'scalar', 'index'],
  body: (arr, a, idx) => {
    var v = a;
    var i;
    for (i = 0; i < idx.length - 1; ++i) {
      v = v[idx[i]];
    }
    v[idx[idx.length - 1]] = arr;
  }
});

function unpackArray <D extends ndarray.Data> (arr: ndarray.NdArray<D>) {
  var result = initNativeArray(arr.shape, 0);
  doUnpack(arr, result);
  return result;
}