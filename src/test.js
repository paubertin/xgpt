'use strict'
function View1dfloat32(a, b0, c0, d) {
  this.data = a
  this.shape = [b0]
  this.stride = [c0]
  this.offset = d | 0
}

let proto = View1dfloat32.prototype
proto.dtype = 'float32'
proto.dimension = 1
Object.defineProperty(proto, 'size', {
  get: function View1dfloat32_size() {
    return this.shape[0]
  }
})
proto.order = [0]
proto.set = function View1dfloat32_set(i0, v) {
  return this.data[this.offset + this.stride[0] * i0] = v
}
proto.get = function View1dfloat32_get(i0) {
  return this.data[this.offset + this.stride[0] * i0]
}
proto.index = function View1dfloat32_index(
  i0
) { return this.offset + this.stride[0] * i0 }
proto.hi = function View1dfloat32_hi(i0) { return new View1dfloat32(this.data, (typeof i0 !== 'number' || i0 < 0) ? this.shape[0] : i0 | 0, this.stride[0], this.offset) }
proto.lo = function View1dfloat32_lo(i0) {
  let b = this.offset, d = 0, a0 = this.shape[0], c0 = this.stride[0]
  if (typeof i0 === 'number' && i0 >= 0) { d = i0 | 0; b += c0 * d; a0 -= d }
  return new View1dfloat32(this.data, a0, c0, b)
}
proto.step = function View1dfloat32_step(i0) {
  let a0 = this.shape[0], b0 = this.stride[0], c = this.offset, d = 0, ceil = Math.ceil
  if (typeof i0 === 'number') { d = i0 | 0; if (d < 0) { c += b0 * (a0 - 1); a0 = ceil(-a0 / d) } else { a0 = ceil(a0 / d) } b0 *= d }
  return new View1dfloat32(this.data, a0, b0, c)
}
proto.transpose = function View1dfloat32_transpose(i0) {
  i0 = (i0 === undefined ? 0 : i0 | 0)
  let a = this.shape, b = this.stride; return new View1dfloat32(this.data, a[i0], b[i0], this.offset)
}
proto.pick = function View1dfloat32_pick(i0) {
  let a = [], b = [], c = this.offset
  if (typeof i0 === 'number' && i0 >= 0) { c = (c + this.stride[0] * i0) | 0 } else { a.push(this.shape[0]); b.push(this.stride[0]) }
  let ctor = CTOR_LIST[a.length + 1]; return ctor(this.data, a, b, c)
}
return function construct_View1dfloat32(data, shape, stride, offset) { return new View1dfloat32(data, shape[0], stride[0], offset) }