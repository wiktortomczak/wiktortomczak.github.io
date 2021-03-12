
export default class Sets {

  static difference(a, b) {
    return [...a].filter(e => !b.has(e));
  }
}
