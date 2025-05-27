export class RingBuffer {
  constructor(capacity = 100) {
    this.capacity = Math.max(1, capacity);
    this.buffer = new Array(this.capacity);
    this.start = 0;
    this.length = 0;
  }

  push(item) {
    this.buffer[(this.start + this.length) % this.capacity] = item;
    if (this.length < this.capacity) {
      this.length++;
    } else {
      this.start = (this.start + 1) % this.capacity;
    }
  }

  toArray() {
    const result = [];
    for (let i = 0; i < this.length; i++) {
      result.push(this.buffer[(this.start + i) % this.capacity]);
    }
    return result;
  }

  clear() {
    this.start = 0;
    this.length = 0;
  }

  get size() {
    return this.length;
  }
}
