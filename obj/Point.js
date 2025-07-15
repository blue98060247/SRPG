export default class Point {
  constructor(xOrKey, y) {
    if (typeof xOrKey === 'string' && y === undefined) {
      const [xStr, yStr] = xOrKey.split(',');
      this.x = Number(xStr);
      this.y = Number(yStr);
    } else {
      this.x = xOrKey;
      this.y = y;
    }
  }
  toString() {
    return `${this.x},${this.y}`;
  }
}