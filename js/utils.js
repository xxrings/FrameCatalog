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

export function uniqSorted(values, compareFn) {
  const cleaned = [...new Set(values.filter(value => value !== undefined && value !== null && value !== ''))];
  return compareFn ? cleaned.sort(compareFn) : cleaned.sort();
}

export function formatList(values, maxItems = values.length) {
  const list = values.slice(0, maxItems);
  if (!list.length) return 'None listed';
  if (values.length > maxItems) return `${list.join(', ')} +${values.length - maxItems} more`;
  return list.join(', ');
}

export function formatCount(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatRange(values, suffix = '') {
  if (!values.length) return 'Not listed';
  if (values.length === 1) return `${values[0]}${suffix}`;
  return `${values[0]}-${values[values.length - 1]}${suffix}`;
}
