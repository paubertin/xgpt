
declare module 'ndarray-gemm' {
  import ndarray from "ndarray";
  export default function <D extends ndarray.Data> (a: ndarray.NdArray<D>, b: ndarray.NdArray<D>, c: ndarray.NdArray<D>, d?: boolean, e?: boolean): void {};
}