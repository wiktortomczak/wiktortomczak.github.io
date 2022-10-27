
import moment from 'moment';


export default class Dates {

  static now() {
    return new Date();
  }

  static fromString(s) {
    return moment(s).toDate();
  }

  static toString(date, format) {
    return moment(date).format(format || 'YYYY-MM-DD HH:mm:ss');
  }

  static fromObj(timestampObj) {
    return this.fromString(timestampObj.timestampStr);
  }

  static toObj(date) {
    // TODO: Return Timestamp instance.
    return {timestampStr: date.toISOString()};
  }

  static fromSecondsSinceEpoch(seconds) {
    return new Date(seconds * 1000);  // TODO: timezone.
  }

  static toSecondsSinceEpoch(date) {
    return date.getTime() / 1000;
  }

  static toMillisecondsSinceEpoch(date) {
    return date.getTime();
  }

  static equal(a, b) {
    return a.getTime() == b.getTime();
  }

  static add(date, duration) {
    return moment(date).add(duration).toDate();
  }

  static addSeconds(date, seconds) {
    return moment(date).add(seconds, 's').toDate();
  }

  static addMilliseconds(date, millis) {
    return moment(date).add(millis, 'ms').toDate();
  }

  static subtract(date, duration) {
    return moment(date).subtract(duration).toDate();
  }

  static subtractSeconds(date, seconds) {
    return moment(date).subtract(seconds, 's').toDate();
  }

  static subtractMilliseconds(date, millis) {
    return moment(date).subtract(millis, 'ms').toDate();
  }

  static differenceSeconds(a, b) {
    return moment(a).diff(b, 'seconds');
  }

  static differenceMilliseconds(a, b) {
    return moment(a).diff(b, 'milliseconds');
  }
}
