
export default class Types {

  static isDefined(x) {
    return typeof x != 'undefined';
  }

  static isUndefined(x) {
    return typeof x == 'undefined';
  }

  static isNullOrUndefined(x) {
    return (x === null) || this.isUndefined(x);
  }

  static isArray(x) {
    return x instanceof Array;
  }

  static isObject(x) {
    return x instanceof Object;
  }

  static isFunction(x) {
    return typeof x == 'function';
  }

  static isBoolean(x) {
    return typeof x == 'boolean';
  }

  static isNumber(x) {
    return typeof x == 'number';
  }

  static isString(x) {
    return typeof x == 'string';
  }

  static isScalar(x) {
    return (x === null) || this.scalarTypes.has(typeof x);
  }
}

Types.scalarTypes = new Set(['undefined', 'number', 'string', 'boolean']);
