// ===========================================================================
// main.js
// ===========================================================================
//
// Catalog page logic: filters (including search) and thumbnail grid.
// ===========================================================================

const CatalogApp = (function() {
  // DOM containers
  let filtersContainer, thumbsContainer, template;

  // Full frames dataset
  let allFrames = [];

  // ---------- INITIALIZATION ----------

  function initMainPage() {
    filtersContainer = document.getElementById('filters');
    thumbsContainer  = document.getElementById('thumbnails');
    template         = document.getElementById('thumbnail-template');

    fetch('data/frames.json')
      .then(res => res.json())
      .then(frames => {
        allFrames = frames.filter(f => !f.Discontinued);
        buildFilterControls();
        renderThumbnails(allFrames);
        hookMultiDropdowns();
      })
      .catch(err => {
        thumbsContainer.innerHTML = '<p class="error">Failed to load catalog.</p>';
        console.error(err);
      });
  }

  // ---------- BUILD FILTER UI ----------

  function buildFilterControls() {
    const html = [];

    // Precompute distinct values
    const allColors    = [...new Set(allFrames.flatMap(f => f.ColorTags))].sort();
    const allEyeSizes  = [...new Set(allFrames.map(f => f.EyeSize))].sort((a,b)=>a-b);
    const allBs        = [...new Set(allFrames.map(f => f.B))].sort((a,b)=>a-b);
    const allPDs       = [...new Set(allFrames.map(f => f.FramePD))].sort((a,b)=>a-b);
    const allTemples   = [...new Set(allFrames.map(f => f.Temple))].sort((a,b)=>a-b);
    const allMaterials = [...new Set(allFrames.map(f => f.Material))].sort();

    // --- Search Box ---
    html.push('<div class="filter-group search-group">');
    html.push('  <label for="filter-search">Search:</label>');
    html.push('  <input type="text" id="filter-search" placeholder="Name, color, size, etc.">');
    html.push('</div>');

    // --- Material ---
    html.push('<div class="filter-group">');
    html.push('  <label for="filter-material">Material:</label>');
    html.push('  <select id="filter-material">');
    html.push('    <option value="">All</option>');
    allMaterials.forEach(m => {
      html.push(`    <option value="${m}">${m}</option>`);
    });
    html.push('  </select>');
    html.push('</div>');

    // --- Color ---
    html.push('<div class="filter-group">');
    html.push('  <label for="filter-color">Color:</label>');
    html.push('  <select id="filter-color">');
    html.push('    <option value="">All</option>');
    allColors.forEach(c => {
      html.push(`    <option value="${c}">${c}</option>`);
    });
    html.push('  </select>');
    html.push('</div>');

    // --- Eye Size (multi) ---
    html.push('<div class="filter-group">');
    html.push('  <label>Eye Size:</label>');
    html.push('  <div class="multi-dropdown" id="filter-eyesize-dropdown">');
    html.push('    <button type="button" class="multi-dropdown-btn">Select Eye Size</button>');
    html.push('    <div class="multi-dropdown-menu">');
    allEyeSizes.forEach(sz => {
      html.push(`<label><input type="checkbox" value="${sz}"> ${sz}</label>`);
    });
    html.push('    </div>');
    html.push('  </div>');
    html.push('</div>');

    // --- B measurement (multi) ---
    html.push('<div class="filter-group">');
    html.push('  <label>B:</label>');
    html.push('  <div class="multi-dropdown" id="filter-b-dropdown">');
    html.push('    <button type="button" class="multi-dropdown-btn">Select B</button>');
    html.push('    <div class="multi-dropdown-menu">');
    allBs.forEach(b => {
      html.push(`<label><input type="checkbox" value="${b}"> ${b}</label>`);
    });
    html.push('    </div>');
    html.push('  </div>');
    html.push('</div>');

    // --- Frame PD (multi) ---
    html.push('<div class="filter-group">');
    html.push('  <label>Frame PD:</label>');
    html.push('  <div class="multi-dropdown" id="filter-pd-dropdown">');
    html.push('    <button type="button" class="multi-dropdown-btn">Select PD</button>');
    html.push('    <div class="multi-dropdown-menu">');
    allPDs.forEach(pd => {
      html.push(`<label><input type="checkbox" value="${pd}"> ${pd}</label>`);
    });
    html.push('    </div>');
    html.push('  </div>');
    html.push('</div>');

    // --- Temple (multi) ---
    html.push('<div class="filter-group">');
    html.push('  <label>Temple:</label>');
    html.push('  <div class="multi-dropdown" id="filter-temple-dropdown">');
    html.push('    <button type="button" class="multi-dropdown-btn">Select Temple</button>');
    html.push('    <div class="multi-dropdown-menu">');
    allTemples.forEach(t => {
      html.push(`<label><input type="checkbox" value="${t}"> ${t}</label>`);
    });
    html.push('    </div>');
    html.push('  </div>');
    html.push('</div>');

    // --- Apply & Clear ---
    html.push('<div class="filter-actions button-group">');
    html.push('  <button id="filter-apply">Apply</button>');
    html.push('  <button id="filter-clear">Clear</button>');
    html.push('</div>');

    filtersContainer.innerHTML = html.join('\n');

    // Wire up buttons
    document.getElementById('filter-apply')
      .addEventListener('click', () => renderThumbnails(applyFilters()));
    document.getElementById('filter-clear')
      .addEventListener('click', () => {
        clearFilters();
        renderThumbnails(allFrames);
      });
  }

  // ---------- RENDER THUMBNAILS ----------

  function renderThumbnails(framesToShow) {
    thumbsContainer.innerHTML = '';
    // Group SKUs by FrameName
    const groups = [];
    framesToShow.forEach(sku => {
      let grp = groups.find(g => g.frameName === sku.FrameName);
      if (!grp) {
        grp = { frameName: sku.FrameName, skus: [] };
        groups.push(grp);
      }
      grp.skus.push(sku);
    });

    // Alphabetical sort
    groups.sort((a, b) =>
      a.frameName.localeCompare(b.frameName)
    );

    // Build cards
    groups.forEach(group => {
      const skuList  = group.skus;
      const isSafety = skuList.some(sku => sku.Material === 'Safety');
      const isSport  = skuList.some(sku => sku.Material === 'Sport');
      const imgPath  = `images/${skuList[0].HeroImage || 'coming-soon.jpg'}`;

      const clone = template.content.cloneNode(true);
      const link  = clone.querySelector('.thumb-link');
      const img   = clone.querySelector('.thumb-img');
      const name  = clone.querySelector('.thumb-name');
      const label = clone.querySelector('.thumb-label');

      link.href         = `details.html?frame=${encodeURIComponent(group.frameName)}`;
      img.src           = imgPath;
      name.textContent  = group.frameName;

      // Badge
      if (isSafety)       label.textContent = 'Safety';
      else if (isSport)   label.textContent = 'Sport';
      else                label.remove();

      thumbsContainer.appendChild(clone);
    });
  }

  // ---------- FILTER + SEARCH LOGIC ----------

  function applyFilters() {
    const term = document.getElementById('filter-search')
                   .value.trim().toLowerCase();

    return allFrames.filter(sku => {
      // --- text search across all fields ---
      if (term) {
        const matches = 
          sku.FrameName.toLowerCase().includes(term)
          || sku.ColorTags.some(c => c.toLowerCase().includes(term))
          || String(sku.EyeSize).includes(term)
          || String(sku.B).includes(term)
          || String(sku.FramePD).includes(term)
          || String(sku.Temple).includes(term)
          || sku.Material.toLowerCase().includes(term);

        if (!matches) return false;
      }

      // --- dropdown filters ---
      const mat = document.getElementById('filter-material').value;
      if (mat && sku.Material !== mat) return false;

      const col = document.getElementById('filter-color').value;
      if (col && !sku.ColorTags.includes(col)) return false;

      // --- multi-checkbox filters ---
      const eyeChecks = Array.from(
        document.querySelectorAll('#filter-eyesize-dropdown input:checked')
      ).map(cb => cb.value);
      if (eyeChecks.length && !eyeChecks.includes(String(sku.EyeSize)))
        return false;

      const bChecks = Array.from(
        document.querySelectorAll('#filter-b-dropdown input:checked')
      ).map(cb => cb.value);
      if (bChecks.length && !bChecks.includes(String(sku.B)))
        return false;

      const pdChecks = Array.from(
        document.querySelectorAll('#filter-pd-dropdown input:checked')
      ).map(cb => cb.value);
      if (pdChecks.length && !pdChecks.includes(String(sku.FramePD)))
        return false;

      const tChecks = Array.from(
        document.querySelectorAll('#filter-temple-dropdown input:checked')
      ).map(cb => cb.value);
      if (tChecks.length && !tChecks.includes(String(sku.Temple)))
        return false;

      return true;
    });
  }

  // ---------- CLEAR FILTERS + SEARCH ----------

  function clearFilters() {
    // clear search
    document.getElementById('filter-search').value = '';
    // single selects
    document.getElementById('filter-material').value = '';
    document.getElementById('filter-color').value    = '';
    // multi-dropdowns
    document.querySelectorAll('.multi-dropdown').forEach(drop => {
      drop.classList.remove('open');
      drop.querySelectorAll('input[type="checkbox"]')
          .forEach(cb => cb.checked = false);
    });
  }

  // ---------- MULTI-DROPDOWN TOGGLE ----------

  function hookMultiDropdowns() {
    document.querySelectorAll('.multi-dropdown').forEach(drop => {
      const btn = drop.querySelector('.multi-dropdown-btn');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        document.querySelectorAll('.multi-dropdown.open')
                .forEach(d => { if (d !== drop) d.classList.remove('open'); });
        drop.classList.toggle('open');
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.multi-dropdown.open')
              .forEach(d => d.classList.remove('open'));
    });
  }

  // publish init
  return { initMainPage };
})();

// auto-start
window.addEventListener('DOMContentLoaded', CatalogApp.initMainPage);
