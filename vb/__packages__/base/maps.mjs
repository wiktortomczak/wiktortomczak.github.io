
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Iterables from 'https://wiktortomczak.github.io/vb/__packages__/base/iterables.mjs';


export default class Maps {

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
