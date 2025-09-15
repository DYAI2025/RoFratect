export class RingBuffer {
  constructor(limit = 200) { this.limit = limit; this.items = []; }
  push(item) { this.items.push(item); if (this.items.length > this.limit) this.items.shift(); }
  last(n) { return this.items.slice(-n); }
  all() { return this.items; }
}

