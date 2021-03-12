
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

  static isNumber(x) {
    return typeof x == 'number';
  }

  static isString(x) {
    return typeof x == 'string';
  }
}
