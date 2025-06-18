// Shared utility functions
export function getById(id) {
  return document.getElementById(id);
}

export function groupBy(array, keyFn) {
  return array.reduce((map, item) => {
    const key = keyFn(item);
    (map[key] = map[key] || []).push(item);
    return map;
  }, {});
}

export function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}