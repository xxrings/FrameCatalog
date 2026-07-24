import { fetchFramesData, getImagePath } from './data-loader.js';
import { buildCatalogItems } from './catalog-model.js';
import { getQueryParam, getById, clearChildren, formatList, formatRange } from './utils.js';

const state = {
  item: null,
  selectedVariant: null
};

function setImageFallback(imgEl) {
  imgEl.addEventListener(
    'error',
    () => {
      imgEl.src = 'images/coming-soon.jpg';
    },
    { once: true }
  );
}

function renderOverview(item) {
  const container = getById('frame-overview');
  container.innerHTML = `
    <article class="overview-card">
      <p class="overview-card__label">Material</p>
      <p class="overview-card__value">${item.materialLabel}</p>
      <p class="overview-card__detail">${item.types.filter(type => type !== 'Standard').join(' / ') || 'Everyday optical frame'}</p>
    </article>
    <article class="overview-card">
      <p class="overview-card__label">Available colors</p>
      <p class="overview-card__value">${item.colorCount}</p>
      <p class="overview-card__detail">${formatList(item.colors, 3)}</p>
    </article>
    <article class="overview-card">
      <p class="overview-card__label">Eye sizes</p>
      <p class="overview-card__value">${formatRange(item.eyeSizes)}</p>
      <p class="overview-card__detail">${formatList(item.eyeSizes.map(String), 4)}</p>
    </article>
    <article class="overview-card">
      <p class="overview-card__label">Frame PD</p>
      <p class="overview-card__value">${formatRange(item.pds)}</p>
      <p class="overview-card__detail">Temple lengths ${formatList(item.temples.map(String), 3)}</p>
    </article>
  `;
}

function renderSelectorButtons(label, values, selectedValue, type) {
  return `
    <div class="selector-row">
      <p class="selector-label">${label}</p>
      <div class="selector-options" role="group" aria-label="${label}">
        ${values
          .map(
            value => `
              <button
                type="button"
                class="selector-button"
                data-selector="${type}"
                data-value="${value}"
                aria-pressed="${String(value) === String(selectedValue)}"
              >
                ${value}
              </button>
            `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderSelectorsMarkup() {
  const item = state.item;
  const selected = state.selectedVariant;
  const colors = [...new Set(item.variants.map(variant => variant.Color))].sort();
  const sizes = [...new Set(item.variants.map(variant => variant.EyeSize))].sort((a, b) => a - b);

  return `
    ${renderSelectorButtons('Color', colors, selected.Color, 'color')}
    ${renderSelectorButtons('Eye size', sizes, selected.EyeSize, 'size')}
  `;
}

function getGalleryImages(variant) {
  const hero = variant.HeroImage || 'coming-soon.jpg';
  return [hero, ...variant.Images.filter(image => image !== hero)];
}

function renderGallery() {
  const variant = state.selectedVariant;
  const gallery = getById('gallery');
  const images = getGalleryImages(variant);
  const typeChips = state.item.types.filter(type => type !== 'Standard');
  const variantStatusMarkup = variant.BackOrdered
    ? `
        <section class="detail-gallery__alert" role="status" aria-live="polite">
          <strong>Back ordered</strong>
          <span>This selected color and size is currently on back order.</span>
        </section>
      `
    : `
        <section class="detail-gallery__alert detail-gallery__alert--available" role="status" aria-live="polite">
          <strong>Available now</strong>
          <span>This selected color and size is currently listed as available.</span>
        </section>
      `;

  gallery.innerHTML = `
    <div class="detail-gallery__figure">
      <div class="detail-gallery__frame">
        <span class="detail-gallery__status ${variant.BackOrdered ? 'detail-gallery__status--warning' : ''}">
          ${variant.BackOrdered ? 'Back ordered' : 'Current selection'}
        </span>
        <img id="detail-main-image" src="${getImagePath(images[0])}" alt="${state.item.name} frame in ${variant.Color}" />
      </div>
      <div id="gallery-thumbs" class="detail-gallery__thumbs"></div>
    </div>
    <div class="detail-gallery__info">
      ${variantStatusMarkup}
      <section class="detail-gallery__panel detail-gallery__panel--selectors" aria-label="Frame variants">
        <h2>Choose your frame</h2>
        ${renderSelectorsMarkup()}
      </section>
      <section class="detail-gallery__panel">
        <h2>Selected variant</h2>
        <ul class="detail-gallery__facts">
          <li><strong>Status:</strong> ${variant.BackOrdered ? 'Back ordered' : 'Available'}</li>
          <li><strong>Color:</strong> ${variant.Color}</li>
          <li><strong>Eye size:</strong> ${variant.EyeSize}</li>
          <li><strong>B measurement:</strong> ${variant.B}</li>
          <li><strong>DBL:</strong> ${variant.DBL}</li>
          <li><strong>Frame PD:</strong> ${variant.FramePD}</li>
          <li><strong>Temple:</strong> ${variant.Temple} mm</li>
          <li><strong>SKU:</strong> ${variant.SKU}</li>
        </ul>
      </section>
      <section class="detail-gallery__panel">
        <h2>Catalog notes</h2>
        <p class="site-note">
          Use this page to review available measurements and current variants before final selection.
        </p>
        <div class="detail-gallery__chips">
          ${variant.Materials.map(material => `<span class="catalog-chip">${material}</span>`).join('')}
          ${typeChips.map(type => `<span class="catalog-chip">${type}</span>`).join('')}
          ${variant.ColorTags.map(color => `<span class="catalog-chip">${color}</span>`).join('')}
        </div>
      </section>
    </div>
  `;

  const mainImage = getById('detail-main-image');
  setImageFallback(mainImage);

  const thumbs = getById('gallery-thumbs');
  clearChildren(thumbs);

  images.forEach((image, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `gallery-thumb${index === 0 ? ' is-active' : ''}`;
    button.innerHTML = `<img src="${getImagePath(image)}" alt="${state.item.name} alternate view ${index + 1}" />`;
    setImageFallback(button.querySelector('img'));
    button.addEventListener('click', () => {
      mainImage.src = getImagePath(image);
      document.querySelectorAll('.gallery-thumb').forEach(thumb => thumb.classList.remove('is-active'));
      button.classList.add('is-active');
    });
    thumbs.appendChild(button);
  });
}

function renderTable() {
  const container = getById('sku-table');
  container.innerHTML = `
    <div class="variant-table__header">
      <div>
        <h2 id="variants-title">Available variants</h2>
        <p class="variant-table__summary">Select a row to update the image and measurements above.</p>
      </div>
      <p class="variant-table__summary">${state.item.variants.length} variants listed</p>
    </div>
    <div class="variant-table__wrap">
      <table>
        <thead>
          <tr>
            <th>Color</th>
            <th>Eye</th>
            <th>B</th>
            <th>DBL</th>
            <th>PD</th>
            <th>Temple</th>
            <th>SKU</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="sku-table-body"></tbody>
      </table>
    </div>
  `;

  const tbody = getById('sku-table-body');
  state.item.variants.forEach(variant => {
    const row = document.createElement('tr');
    row.className = `variant-row${variant.SKU === state.selectedVariant.SKU ? ' is-selected' : ''}`;
    row.innerHTML = `
      <td>${variant.Color}</td>
      <td>${variant.EyeSize}</td>
      <td>${variant.B}</td>
      <td>${variant.DBL}</td>
      <td>${variant.FramePD}</td>
      <td>${variant.Temple}</td>
      <td>${variant.SKU}</td>
      <td>
        <span class="status-pill${variant.BackOrdered ? ' status-pill--warning' : ''}">
          ${variant.BackOrdered ? 'Back ordered' : 'Available'}
        </span>
      </td>
    `;
    row.addEventListener('click', () => selectVariant(variant));
    tbody.appendChild(row);
  });
}

function syncDetailView() {
  const item = state.item;
  getById('frame-name').textContent = item.name;
  getById('frame-subtitle').textContent = `${item.summary}. Eye sizes ${formatList(item.eyeSizes.map(String), 4)} with frame PD ${formatRange(item.pds)}.`;
  renderGallery();
  renderOverview(item);
  renderTable();
}

function findMatchingVariant({ color, size }) {
  const item = state.item;
  return (
    item.variants.find(variant => variant.Color === color && variant.EyeSize === Number(size)) ||
    item.variants.find(variant => variant.Color === color) ||
    item.variants.find(variant => variant.EyeSize === Number(size)) ||
    item.variants[0]
  );
}

function selectVariant(variantOrPartial) {
  const nextVariant =
    'SKU' in variantOrPartial
      ? variantOrPartial
      : findMatchingVariant({
          color: variantOrPartial.color ?? state.selectedVariant.Color,
          size: variantOrPartial.size ?? state.selectedVariant.EyeSize
        });

  state.selectedVariant = nextVariant;
  syncDetailView();
}

function hookDetailEvents() {
  getById('gallery').addEventListener('click', event => {
    const button = event.target.closest('[data-selector]');
    if (!button) return;

    if (button.dataset.selector === 'color') {
      selectVariant({ color: button.dataset.value });
      return;
    }

    if (button.dataset.selector === 'size') {
      selectVariant({ size: Number(button.dataset.value) });
    }
  });
}

function renderError(message) {
  document.body.innerHTML = `<main class="detail-error"><p>${message}</p></main>`;
}

export async function initDetailPage() {
  const frameName = getQueryParam('frame');
  if (!frameName) {
    renderError('Frame details are unavailable because no frame was selected.');
    return;
  }

  const backButton = getById('back-button');
  backButton.addEventListener('click', event => {
    try {
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
        event.preventDefault();
        window.history.back();
      }
    } catch (_error) {
      // Fall back to the catalog link if the referrer cannot be parsed.
    }
  });

  try {
    const frames = await fetchFramesData();
    const items = buildCatalogItems(frames);
    const item = items.find(entry => entry.name === frameName);

    if (!item) {
      renderError('Frame not found in the current catalog.');
      return;
    }

    state.item = item;
    state.selectedVariant = item.heroVariant || item.variants[0];

    hookDetailEvents();
    syncDetailView();
  } catch (err) {
    console.error(err);
    renderError('Failed to load frame details.');
  }
}
