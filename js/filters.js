import { getById } from './utils.js';

// Build filter panel controls based on frames data
export function buildFilterControls(frames) {
  const uniq = arr => [...new Set(arr)].sort();
  const colors = uniq(frames.flatMap(f => f.ColorTags || []));
  const materials = uniq(frames.map(f => f.Material));
  const eyeSizes = uniq(frames.map(f => String(f.EyeSize)));
  const bs = uniq(frames.map(f => String(f.B)));
  const pds = uniq(frames.map(f => String(f.FramePD)));
  const temples = uniq(frames.map(f => String(f.Temple)));

  const container = getById('filters');
  container.innerHTML = [
    `<div class="filter-group search-group">
       <label for="filter-search">Search:<\/label>
       <input type="text" id="filter-search" placeholder="Name, color, size, etc." \/>
     <\/div>`,
    multiDropdown('Material','filter-material', materials),
    multiDropdown('Color','filter-color', colors),
    multiDropdown('Eye Size','filter-eyesize', eyeSizes),
    multiDropdown('B','filter-b', bs),
    multiDropdown('Frame PD','filter-pd', pds),
    multiDropdown('Temple Length','filter-temple', temples),
    `<div class="filter-actions button-group">
       <button id="filter-apply">Apply<\/button>
       <button id="filter-clear">Clear<\/button>
     <\/div>`
  ].join('\n');
}

// helper to render one multi-checkbox block
function multiDropdown(label, id, values) {
  const opts = values.map(v => `<label><input type=\"checkbox\" value=\"${v}\"> ${v}</label>`).join('');
  return `
  <div class="filter-group">
    <div class="multi-dropdown" id="${id}">
      <button type="button" class="multi-dropdown-btn">Select ${label}</button>
      <div class="multi-dropdown-menu">
        ${opts}
      </div>
    </div>
  <\/div>`;
}

// Read current filter inputs
export function getFilterState() {
  const term = (getById('filter-search').value || '').trim().toLowerCase();
  const readChecked = id => Array.from(document.querySelectorAll(`#${id} input:checked`)).map(cb => cb.value);
  return {
    term,
    materials: readChecked('filter-material'),
    colors: readChecked('filter-color'),
    eyeSizes: readChecked('filter-eyesize'),
    bs: readChecked('filter-b'),
    pds: readChecked('filter-pd'),
    temples: readChecked('filter-temple')
  };
}

// Filter frames against state
export function applyFilterLogic(frames, state) {
  return frames.filter(f => {
    if (state.term) {
      const hay = [f.FrameName, f.Material, ...(f.ColorTags || [])].join(' ').toLowerCase();
      if (!hay.includes(state.term)) return false;
    }
    if (state.materials.length && !state.materials.includes(f.Material)) return false;
    if (state.colors.length && !f.ColorTags.some(c => state.colors.includes(c))) return false;
    if (state.eyeSizes.length && !state.eyeSizes.includes(String(f.EyeSize))) return false;
    if (state.bs.length && !state.bs.includes(String(f.B))) return false;
    if (state.pds.length && !state.pds.includes(String(f.FramePD))) return false;
    if (state.temples.length && !state.temples.includes(String(f.Temple))) return false;
    return true;
  });
}