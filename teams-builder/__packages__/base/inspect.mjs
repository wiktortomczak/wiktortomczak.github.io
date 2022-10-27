
// stackoverflow.com/a/9924463/2131969
export function getArgumentNames(f) {
  const fStr = f.toString().replace(_STRIP_COMMENTS, '');
  const argumentsStr = fStr.slice(fStr.indexOf('(') + 1, fStr.indexOf(')'));
  return argumentsStr.match(_ARGUMENT_NAMES) || [];
}

const _STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const _ARGUMENT_NAMES = /([^\s,]+)/g;
