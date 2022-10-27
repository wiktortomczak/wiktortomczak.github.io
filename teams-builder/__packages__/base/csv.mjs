
import assert from 'base/assert.mjs';
import StringBuilder from 'base/stringbuilder.mjs';


// stackoverflow.com/a/14991797
export function parseCSVLine(str) {
  const row = [];

  const len = str.length;
  let token = new StringBuilder();
  let quote = false;  // 'true' means we're inside a quoted field.
  // Iterate over each character, keep track of current token.
  for (let c = 0; c < len; c++) {
    const cc = str[c], nc = str[c+1];      // Current character, next character

    // If the current character is a quotation mark, and we're inside a
    // quoted field, and the next character is also a quotation mark,
    // add a quotation mark to the current token and skip the next character.
    if (cc == '"' && quote && nc == '"') { token.append(cc); ++c; continue; }

    // If it's just one quotation mark, begin/end quoted field
    if (cc == '"') { quote = !quote; continue; }

    // If it's a comma and we're not in a quoted field, move on to the next token.
    if (cc == ',' && !quote) {
      row.push(token.build());
      token = new StringBuilder();
      continue;
    }

    if (cc == '\r' || nc == '\n') {
      assert(quote);
    }

    // Otherwise, append the current character to the current token.
    token.append(cc);
  }

  if (token.length) {
    row.push(token.build());
  }

  return row;
}
