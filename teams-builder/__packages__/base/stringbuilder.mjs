
export default class StringBuilder {

  constructor() {
    this._chars = [];  // TODO
  }

  get length() { return this._chars.length; }

  append(c) {
    this._chars.push(c);
  }

  build() {
    return this._chars.join('');
  }
}
