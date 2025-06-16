// main.js
// ===========================================================================
// CatalogApp — loads data, builds filters, renders thumbnails, hooks events
// ===========================================================================

const CatalogApp = {
  allFrames: [],
  filtersContainer: null,
  thumbsContainer: null,
  template: null,

  // 1) Entry point called from index.html
  initMainPage() {
    this.filtersContainer = document.getElementById('filters');
    this.thumbsContainer = document.getElementById('thumbnails');
    this.template = document.getElementById('thumbnail-template');
    this.loadData();
  },

  // 2) Load frames.json and initialize UI
  async loadData() {
    try {
      const resp = await fetch('data/frames.json');
      const frames = await resp.json();
      // exclude discontinued
      this.allFrames = frames.filter(f => !f.Discontinued);

      this.buildFilterControls();
      this.renderThumbnails(this.allFrames);
      this.hookMultiDropdowns();
    } catch (err) {
      console.error("Failed to load frames.json:", err);
      this.thumbsContainer.innerHTML = '<p class="error">Failed to load catalog.</p>';
    }
  },

  // 3) Build the filter panel HTML
  buildFilterControls() {
    const data = this.allFrames;
    const uniq = arr => [...new Set(arr)].sort((a,b)=>a.toString().localeCompare(b.toString()));

    const colors = uniq(data.flatMap(d => d.ColorTags));
    const materials = uniq(data.map(d => d.Material));
    const eyeSizes = uniq(data.map(d => d.EyeSize));
    const bs = uniq(data.map(d => d.B));
    const pds = uniq(data.map(d => d.FramePD));
    const temples = uniq(data.map(d => d.Temple));

    this.filtersContainer.innerHTML = [
      // Search box
      `<div class="filter-group search-group">
         <label for="filter-search">Search:</label>
         <input type="text" id="filter-search" placeholder="Name, color, size, etc.">
       </div>`,

      // Material
      this._multiDropdownHTML('Material', 'filter-material-dropdown', materials),

      // Color
      this._multiDropdownHTML('Color', 'filter-color-dropdown', colors),

      // Eye Size
      this._multiDropdownHTML('Eye Size', 'filter-eyesize-dropdown', eyeSizes),

      // B
      this._multiDropdownHTML('B', 'filter-b-dropdown', bs),

      // Frame PD
      this._multiDropdownHTML('Frame PD','filter-pd-dropdown', pds),

      // Temple
      this._multiDropdownHTML('Temple', 'filter-temple-dropdown', temples),

      // Apply & Clear
      `<div class="filter-actions button-group">
         <button id="filter-apply">Apply</button>
         <button id="filter-clear">Clear</button>
       </div>`
    ].join('\n');
  },

  // helper to render one multi-checkbox dropdown block
  _multiDropdownHTML(label, id, values) {
    const opts = values.map(v => `<label><input type="checkbox" value="${v}"> ${v}</label>`).join('');
    return `
    <div class="filter-group">
      <label>${label}:</label>
      <div class="multi-dropdown" id="${id}">
        <button type="button" class="multi-dropdown-btn">Select ${label}</button>
        <div class="multi-dropdown-menu">
          ${opts}
        </div>
      </div>
    </div>`;
  },

  // 4) Render the thumbnail grid
  renderThumbnails(frames) {
    const container = this.thumbsContainer;
    container.innerHTML = '';

    // group SKUs by FrameName
    const groups = new Map();
    frames.forEach(sku => {
      const name = sku.FrameName;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(sku);
    });

    // build frameGroups array
    const frameGroups = [];
    groups.forEach((skuList, frameName) => {
      // pick first valid HeroImage
      let repImg = '';
      for (const sku of skuList) {
        if (sku.HeroImage && !sku.HeroImage.toLowerCase().includes('coming-soon')) {
          repImg = sku.HeroImage;
          break;
        }
      }
      const imgPath = repImg
        ? `images/${repImg}`
        : 'images/coming-soon.jpg';

      // safety/sport flags
      const isSafety = skuList.some(s => s.Material && s.Material.toLowerCase() === 'safety');
      const isSport = skuList.some(s => s.Material && s.Material.toLowerCase() === 'sport');

      frameGroups.push({ frameName, imgPath, isSafety, isSport });
    });

    // alphabetical sort
    frameGroups.sort((a,b) => a.frameName.localeCompare(b.frameName));

    // render each card
    frameGroups.forEach(g => {
      const clone = this.template.content.cloneNode(true);
      const link = clone.querySelector('.thumb-link');
      const img = clone.querySelector('.thumb-img');
      const name = clone.querySelector('.thumb-name');
      const label = clone.querySelector('.thumb-label');

      // badge text
      if (g.isSafety) label.textContent = 'SAFETY';
      else if (g.isSport) label.textContent = 'SPORT';
      else label.textContent = '';

      link.href = `details.html?frame=${encodeURIComponent(g.frameName)}`;
      img.src = g.imgPath;
      img.alt = g.frameName;
      name.textContent = g.frameName;

      container.appendChild(clone);
    });
  },

  // 5) Wire up dropdown toggles, Apply, Clear, and live Search
  hookMultiDropdowns() {
    // dropdown open/close
    document.querySelectorAll('.multi-dropdown').forEach(drop => {
      const btn = drop.querySelector('.multi-dropdown-btn');
      btn.addEventListener('click', () => drop.classList.toggle('open'));
    });
    document.addEventListener('click', e => {
      document.querySelectorAll('.multi-dropdown').forEach(drop => {
        if (!drop.contains(e.target)) drop.classList.remove('open');
      });
    });

    // Apply
    document.getElementById('filter-apply').addEventListener('click', () => {
      const filtered = this.applyFilters();
      this.renderThumbnails(filtered);
    });

    // Clear
    document.getElementById('filter-clear').addEventListener('click', () => {
      // clear search
      const s = document.getElementById('filter-search');
      if (s) s.value = '';
      // uncheck all
      document.querySelectorAll('#filters input[type="checkbox"]').forEach(cb => cb.checked = false);
      // rerender all
      this.renderThumbnails(this.allFrames);
    });

    // Live search
    const searchBox = document.getElementById('filter-search');
    if (searchBox) {
      searchBox.addEventListener('input', () => {
        const filtered = this.applyFilters();
        this.renderThumbnails(filtered);
      });
    }
  },

  // 6) applyFilters reads checkboxes & search term, returns filtered array
  applyFilters() {
    const term = (document.getElementById('filter-search')?.value || '')
                   .trim().toLowerCase();

    return this.allFrames.filter(sku => {
      // text search across key fields
      if (term) {
        const hay = [
          sku.FrameName,
          sku.Material,
          ...sku.ColorTags,
          sku.EyeSize, sku.B, sku.FramePD, sku.Temple
        ].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }

      // helper to read checked box values under a dropdown
      const checked = id =>
        Array.from(document.querySelectorAll(`#${id} input:checked`))
             .map(cb => cb.value);

      // Material
      const mat = checked('filter-material-dropdown');
      if (mat.length && !mat.includes(sku.Material)) return false;

      // Color
      const col = checked('filter-color-dropdown');
      if (col.length && !sku.ColorTags.some(t => col.includes(t))) return false;

      // Eye Size
      const eye = checked('filter-eyesize-dropdown');
      if (eye.length && !eye.includes(String(sku.EyeSize))) return false;

      // B
      const bchk = checked('filter-b-dropdown');
      if (bchk.length && !bchk.includes(String(sku.B))) return false;

      // Frame PD
      const pd = checked('filter-pd-dropdown');
      if (pd.length && !pd.includes(String(sku.FramePD))) return false;

      // Temple
      const t = checked('filter-temple-dropdown');
      if (t.length && !t.includes(String(sku.Temple))) return false;

      return true;
    });
  }
};

// expose globally
window.CatalogApp = CatalogApp;
