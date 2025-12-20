import katex from "katex";

const MATH_DELIM = "$$$";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeWithBreaks = (value: string) =>
  escapeHtml(value).replace(/\n/g, "<br/>");

export function codeforcesDescriptionFormat(rawString: string) {
  let cursor = 0;
  let body = "";

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

  return body.length ? `<p>${body}</p>` : "";
}
