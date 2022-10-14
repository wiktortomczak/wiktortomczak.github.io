

export function createDiv(props) {
  const div = document.createElement('div');
  for (const key in (props || {})) {
    div[key] = props[key];
  }    
  document.body.appendChild(div);
  return div;
}


export function createStyle(css) {
  const styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);
}
