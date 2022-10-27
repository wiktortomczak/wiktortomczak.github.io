
export default function debounce(func, timeout) {
  let timeoutId;  // While defined, subsequent func() calls are lumped into one.
  let nextCallArgs;
  function funcWrapper(...args) {
    if (!timeoutId) {
      func(...args);
    } else {
      nextCallArgs = args;
    }
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (Types.isDefined(nextCallArgs)) {
        funcWrapper(...nextCallArgs);
        nextCallArgs = undefined;
      }
    }, timeout);
  }
  return funcWrapper;
}
