export const siteRoot = new URL('../', import.meta.url);
export const siteUrl = path => new URL(path, siteRoot).href;
export function message(text, element = document.querySelector('[data-status]')) {
  if (element) { element.textContent = text; element.hidden = !text; }
}
export function element(tag, text, className) {
  const el = document.createElement(tag); if (text !== undefined) el.textContent = text;
  if (className) el.className = className; return el;
}
export function clearPrivateContent() {
  document.querySelectorAll('[data-private]').forEach(el => { el.replaceChildren(); el.hidden = true; });
  window.dispatchEvent(new Event('private-content-cleared'));
}

