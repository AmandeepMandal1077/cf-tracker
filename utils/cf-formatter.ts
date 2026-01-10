import katex from "katex";
// const escapeHtml = (value: string) => value;
// .replace(/&/g, "&amp;")
// .replace(/</g, "&lt;")
// .replace(/>/g, "&gt;")
// .replace(/"/g, "&quot;")
// .replace(/'/g, "&#39;");

function escapeKatexSpecialSymbol(text: string) {
  text = text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
  return text.replace(/\$\$\$(.*?)\$\$\$/g, (_match, content) => {
    const escapedContent = content.replace(/[#$~]/g, (char: string) => {
      return `\\${char}`;
    });

    return `$$$${escapedContent}$$$`;
  });
}
const escapeWithBreaks = (value: string) => value.replace(/\n/g, "<br/>");

export function codeforcesDescriptionFormat(rawString: string) {
  let cursor = 0;
  let body = "";
  const MATH_DELIM = "$$$";

  rawString = escapeKatexSpecialSymbol(rawString);
  while (cursor < rawString.length) {
    const start = rawString.indexOf(MATH_DELIM, cursor);

    if (start === -1) {
      body += escapeWithBreaks(rawString.slice(cursor));
      break;
    }

    if (start > cursor) {
      body += escapeWithBreaks(rawString.slice(cursor, start));
    }

    const end = rawString.indexOf(MATH_DELIM, start + MATH_DELIM.length);

    if (end === -1) {
      body += escapeWithBreaks(rawString.slice(start));
      break;
    }

    const mathContent = rawString.slice(start + MATH_DELIM.length, end);
    const html = katex.renderToString(mathContent, { throwOnError: false });
    body += html;

    cursor = end + MATH_DELIM.length;
  }

  return body.length ? `<span>${body}</span>` : "";
}
export function codeforcesInputFormat(rawString: string) {
  let cursor = 0;
  let body = "";

  const INPUT_DELIM = "input";
  const OUTPUT_DELIM = "output";
  while (cursor < rawString.length) {
    const start = rawString.indexOf(INPUT_DELIM, cursor);
    if (start === -1) {
      body += escapeWithBreaks(rawString.slice(cursor));
      break;
    }

    if (start > cursor) {
      body += escapeWithBreaks(rawString.slice(cursor, start));
    }

    body += `<br/><strong>${INPUT_DELIM}</strong>`;

    const end = rawString.indexOf(OUTPUT_DELIM, start + INPUT_DELIM.length);

    if (end === -1) {
      body += escapeWithBreaks(rawString.slice(start));
      break;
    }

    const inputContent = rawString.slice(start + INPUT_DELIM.length, end);
    body += escapeWithBreaks(inputContent);

    cursor = end + OUTPUT_DELIM.length;
    body += `<br/><strong>${OUTPUT_DELIM}</strong>`;
  }

  return body.length ? `<span>${body}</span>` : "";
}
