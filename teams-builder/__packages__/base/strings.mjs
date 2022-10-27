
export default class Strings {

  static partition(s, separator) {
    const i = s.indexOf(separator);
    return [s.substring(0, i), s.substring(i+1)];
  }
}
