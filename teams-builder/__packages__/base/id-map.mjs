
import assert from 'base/assert.mjs';
import Types from 'base/types.mjs';


// https://stackoverflow.com/a/35306050/2131969
export default class IdMap {

  constructor(objects) {
    this._ids = new WeakMap();
    this._nextId = 1;
    if (objects) {
      this.add(objects);
    }
  }

  get(obj) {
    assert(this._ids.has(obj));
    return this._ids.get(obj);
  }

  getAddIfNotSet(obj) {
    const id = this._ids.get(obj);
    if (Types.isDefined(id)) {
      return id;
    } else {
      const newId = this._nextId++;
      this._ids.set(obj, newId);
      return newId;
    }
  }

  add(objects) {
    for (const obj of objects) {
      if (!this._ids.has(obj)) {
        this._ids.set(obj, this._nextId++);
      }
    }
  }
}
