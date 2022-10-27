
import assert from 'base/assert.mjs';
import Iterables from 'base/iterables.mjs';


export default class Maps {

  static fromKeys(keys, value) {
    const map = new Map();
    for (const key of keys) {
      map.set(key, value);
    }
    return map;
  }

  static pop(map, key) {
    const value = map.get(key);
    assert(map.delete(key));
    return value;
  }

  static mapToArray(map, func) {
    const mapped = [];
    map.forEach((...args) => mapped.push(func(...args)));
    return mapped;
  }

  static mapValues(map, func) {
    const mapped = new Map();
    for (const [key, value] of map.entries()) {
      mapped.set(key, func(value));
    }
    return mapped;
  }

  static toObject(map, mappers) {
    const {keyMapper, valueMapper} = mappers || {};
    const obj = {};
    map.forEach((value, key) => {
      if (keyMapper) {
        key = keyMapper(key);
      }
      if (valueMapper) {
        value = valueMapper(value);
      }
      obj[key] = value;
    });
    return obj;
  }

  static valuesArray(map) {
    return Iterables.toArray(map.values());
  }
}
