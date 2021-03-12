
export default class Maps {

  static map(map, func) {
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
}
