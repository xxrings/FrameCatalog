import { getById } from './utils.js';

function renderCheckboxGroup(values, name) {
  return values
    .map(
      value => `
        <label class="filter-option">
          <input type="checkbox" name="${name}" value="${value}" />
          <span>${value}</span>
        </label>
      `
    )
    .join('');
}

function renderNumericGroup(values, name) {
  return renderCheckboxGroup(values.map(String), name);
}

export function buildFilterControls(options) {
  const form = getById('catalog-controls');
  form.innerHTML = `
    <section class="search-field">
      <label for="filter-search">Search frames</label>
      <input
        type="search"
        id="filter-search"
        placeholder="Model, color, material, eye size, PD"
        autocomplete="off"
      />
      <p class="search-help">Search by model name, material, color, eye size, PD, or temple length.</p>
    </section>

    <section>
      <p class="selector-label">Frame type</p>
      <div class="quick-filters">
        ${options.types
          .map(
            type => `
              <label class="quick-filter">
                <input type="checkbox" name="types" value="${type}" />
                <span>${type}</span>
              </label>
            `
          )
          .join('')}
      </div>
    </section>

    <section class="sort-field">
      <label for="filter-sort">Sort results</label>
      <select id="filter-sort">
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
        <option value="size-asc">Smallest eye size first</option>
        <option value="size-desc">Largest eye size first</option>
        <option value="pd-asc">Smallest PD first</option>
        <option value="colors-desc">Most color options</option>
      </select>
    </section>

    <details class="filter-section" open>
      <summary>Material</summary>
      <div class="filter-options">${renderCheckboxGroup(options.materials, 'materials')}</div>
    </details>

    <details class="filter-section" open>
      <summary>Color family</summary>
      <div class="filter-options">${renderCheckboxGroup(options.colors, 'colors')}</div>
    </details>

    <details class="filter-section" open>
      <summary>Eye size</summary>
      <div class="filter-options">${renderNumericGroup(options.eyeSizes, 'eyeSizes')}</div>
    </details>

    <details class="filter-section">
      <summary>Frame PD</summary>
      <div class="filter-options">${renderNumericGroup(options.pds, 'pds')}</div>
    </details>

    <details class="filter-section">
      <summary>Temple length</summary>
      <div class="filter-options">${renderNumericGroup(options.temples, 'temples')}</div>
    </details>

    <div class="filter-actions">
      <button type="button" id="filter-clear" class="button-secondary">Clear filters</button>
    </div>
  `;
}

function readChecked(name) {
  return Array.from(document.querySelectorAll(`#catalog-controls input[name="${name}"]:checked`)).map(
    input => input.value
  );
}

export function getFilterState() {
  return {
    term: (getById('filter-search').value || '').trim().toLowerCase(),
    types: readChecked('types'),
    materials: readChecked('materials'),
    colors: readChecked('colors'),
    eyeSizes: readChecked('eyeSizes'),
    pds: readChecked('pds'),
    temples: readChecked('temples'),
    sortBy: getById('filter-sort').value
  };
}

export function describeActiveFilters(state) {
  const chips = [];

  if (state.term) chips.push(`Search: ${state.term}`);
  chips.push(...state.types.map(type => `Type: ${type}`));
  chips.push(...state.materials.map(material => `Material: ${material}`));
  chips.push(...state.colors.map(color => `Color: ${color}`));
  chips.push(...state.eyeSizes.map(size => `Eye: ${size}`));
  chips.push(...state.pds.map(pd => `PD: ${pd}`));
  chips.push(...state.temples.map(temple => `Temple: ${temple}`));

  return chips;
}
