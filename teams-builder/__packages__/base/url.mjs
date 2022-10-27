
export default function createURL(url) {
  if (url instanceof URL) {
    return url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    return new URL(a.href);
  }
}
