// ===========================================================================
// app.js
// ===========================================================================
//
// Contains both MAIN‐PAGE logic (filters + thumbnails) and DETAIL‐PAGE logic
// (detail selectors, main image, “BACK ORDERED” overlay, SKU table, extra‐views gallery).
//
// Folder structure assumed:
//
// Web/
// ├─ index.html
// ├─ details.html
// ├─ styles.css
// ├─ app.js          ← (this file)
// ├─ /data
// │   └─ frames.json
// └─ /images
//     ├─ (all Hero and extra‐view .jpg/.png files)
//     └─ coming‐soon.jpg
//
// ===========================================================================

const CatalogApp = {
  // Holds the entire array of SKU objects loaded from data/frames.json
  allSKUs: [],

  // The subset of SKUs currently filtered (used only on index.html)
  filteredSKUs: [],

  // When on detail page: the subset of SKUs that share a particular FrameName
  currentFrameSKUs: [],

  // Index within currentFrameSKUs for the currently selected SKU
  currentSKUIndex: null,

  // -------------------------------------------------------------------------
  // MAIN‐PAGE METHODS (index.html)
  // -------------------------------------------------------------------------

  // 1) Initialize the main page: load JSON, build filters, render thumbnails
  async initMainPage() {
    try {
      // Load frames.json
      this.allSKUs = await this.loadAllFrames();
      // Exclude discontinued SKUs from index display
      this.allSKUs = this.allSKUs.filter(sku => sku.Discontinued === false);

      // Build the filter controls
      this.buildFilterControls();

      // Initially, no filters → show all
      this.filteredSKUs = this.allSKUs.slice();
      this.renderThumbnails(this.filteredSKUs);

      // Hook up filter buttons
      document.getElementById('filter-apply')
              .addEventListener('click', () => this.applyFilters());
      document.getElementById('filter-clear')
              .addEventListener('click', () => {
                this.clearFilters();
                this.renderThumbnails(this.allSKUs);
              });

    } catch (err) {
      console.error("Error in initMainPage:", err);
    }
  },

  // Fetch data/frames.json over HTTP and return as an array
  async loadAllFrames() {
    const resp = await fetch('data/frames.json');
    if (!resp.ok) throw new Error(`Failed to fetch frames.json: ${resp.statusText}`);
    return resp.json();
  },

  // Build the filter panel (all dropdowns except FramePD which is hybrid)
  buildFilterControls() {
    const filtersContainer = document.getElementById('filters');
    filtersContainer.innerHTML = ''; // Clear existing

    const skuList = this.allSKUs;

    // --- Gather distinct values for filters ---
    // ColorTags (multi‐select)
    const colorSet = new Set();
    skuList.forEach(rec => {
      if (Array.isArray(rec.ColorTags)) {
        rec.ColorTags.forEach(t => colorSet.add(t.trim()));
      } else if (typeof rec.ColorTags === 'string' && rec.ColorTags.trim() !== '') {
        rec.ColorTags.split(',').map(t => t.trim()).forEach(t => colorSet.add(t));
      }
    });
    const allColors = Array.from(colorSet).sort((a, b) => a.localeCompare(b));

    // Material (single‐select)
    const materialSet = new Set(skuList.map(rec => rec.Material).filter(m => m));
    const allMaterials = Array.from(materialSet).sort((a, b) => a.localeCompare(b));

    // EyeSize (single‐select)
    const eyeSizes = Array.from(new Set(skuList.map(rec => rec.EyeSize))).sort((a, b) => a - b);

    // B (single‐select)
    const bVals = Array.from(new Set(skuList.map(rec => rec.B))).sort((a, b) => a - b);

    // FramePD (for hybrid: distinct values for dropdown)
    const pdVals = Array.from(new Set(skuList.map(rec => rec.FramePD))).sort((a, b) => a - b);

    // Temple (single‐select)
    const templeVals = Array.from(new Set(skuList.map(rec => rec.Temple))).sort((a, b) => a - b);

    // --- Build HTML for filters ---
    const html = [];

    // ColorTags (multi‐select)
    html.push('<div class="filter-group">');
    html.push('  <label for="filter-color">Color:</label>');
    html.push('  <select id="filter-color" multiple size="4">');
    allColors.forEach(tag => {
      html.push(`    <option value="${tag}">${tag}</option>`);
    });
    html.push('  </select>');
    html.push('</div>');

    // Material (single‐select)
    html.push('<div class="filter-group">');
    html.push('  <label for="filter-material">Material:</label>');
    html.push('  <select id="filter-material">');
    html.push('    <option value="">All</option>');
    allMaterials.forEach(mat => {
      html.push(`    <option value="${mat}">${mat}</option>`);
    });
    html.push('  </select>');
    html.push('</div>');

    // EyeSize (single‐select)
    html.push('<div class="filter-group">');
    html.push('  <label for="filter-eyesize">Eye Size (mm):</label>');
    html.push('  <select id="filter-eyesize">');
    html.push('    <option value="">All</option>');
    eyeSizes.forEach(val => {
      html.push(`    <option value="${val}">${val}</option>`);
    });
    html.push('  </select>');
    html.push('</div>');

    // B (single‐select)
    html.push('<div class="filter-group">');
    html.push('  <label for="filter-b">B (mm):</label>');
    html.push('  <select id="filter-b">');
    html.push('    <option value="">All</option>');
    bVals.forEach(val => {
      html.push(`    <option value="${val}">${val}</option>`);
    });
    html.push('  </select>');
    html.push('</div>');

    // --- FramePD Hybrid (exact dropdown + range inputs) ---
    html.push('<div class="filter-group">');
    html.push('  <label>Frame PD (mm):</label>');
    // Exact‐match dropdown
    html.push('  <select id="filter-pd-exact">');
    html.push('    <option value="">All</option>');
    pdVals.forEach(val => {
      html.push(`    <option value="${val}">${val}</option>`);
    });
    html.push('  </select>');
    // Range inputs (used if exact is blank)
    html.push('  <div class="pd-range">');
    html.push('    <input type="number" id="filter-pd-min" placeholder="Min" min="0" />');
    html.push('    <input type="number" id="filter-pd-max" placeholder="Max" min="0" />');
    html.push('  </div>');
    html.push('</div>');

    // Temple (single‐select)
    html.push('<div class="filter-group">');
    html.push('  <label for="filter-temple">Temple (mm):</label>');
    html.push('  <select id="filter-temple">');
    html.push('    <option value="">All</option>');
    templeVals.forEach(val => {
      html.push(`    <option value="${val}">${val}</option>`);
    });
    html.push('  </select>');
    html.push('</div>');

    // Apply & Clear buttons
    html.push('<div class="filter-group button-group">');
    html.push('  <button id="filter-apply">Apply Filters</button>');
    html.push('  <button id="filter-clear">Clear Filters</button>');
    html.push('</div>');

    filtersContainer.innerHTML = html.join('\n');
  },

  // Apply current filter selections and re‐render thumbnails
  applyFilters() {
    // 1) ColorTags (multi‐select)
    const colorSelect = document.getElementById('filter-color');
    const selectedColors = Array.from(colorSelect.selectedOptions)
                                .map(opt => opt.value)
                                .filter(v => v !== '');

    // 2) Material (single‐select)
    const material = document.getElementById('filter-material').value;

    // 3) EyeSize (exact match if selected)
    const esVal = document.getElementById('filter-eyesize').value;
    const selectedEyeSize = esVal === "" ? null : parseInt(esVal, 10);

    // 4) B (exact match if selected)
    const bVal = document.getElementById('filter-b').value;
    const selectedB = bVal === "" ? null : parseInt(bVal, 10);

    // 5) FramePD Hybrid
    const pdExactVal = document.getElementById('filter-pd-exact').value;
    const selectedPDExact = pdExactVal === "" ? null : parseInt(pdExactVal, 10);
    const pdMinVal = parseInt(document.getElementById('filter-pd-min').value) || -Infinity;
    const pdMaxVal = parseInt(document.getElementById('filter-pd-max').value) || Infinity;

    // 6) Temple (exact match if selected)
    const tVal = document.getElementById('filter-temple').value;
    const selectedTemple = tVal === "" ? null : parseInt(tVal, 10);

    // 7) Filter logic
    this.filteredSKUs = this.allSKUs.filter(rec => {
      // ColorTags overlap
      if (selectedColors.length > 0) {
        const tags = Array.isArray(rec.ColorTags)
                   ? rec.ColorTags.map(t => t.trim())
                   : (rec.ColorTags || "").split(',').map(t => t.trim());
        const hasMatch = selectedColors.some(c => tags.includes(c));
        if (!hasMatch) return false;
      }
      // Material
      if (material && rec.Material !== material) return false;
      // EyeSize
      if (selectedEyeSize !== null && rec.EyeSize !== selectedEyeSize) return false;
      // B
      if (selectedB !== null && rec.B !== selectedB) return false;
      // FramePD
      if (selectedPDExact !== null) {
        if (rec.FramePD !== selectedPDExact) return false;
      } else {
        if (rec.FramePD < pdMinVal || rec.FramePD > pdMaxVal) return false;
      }
      // Temple
      if (selectedTemple !== null && rec.Temple !== selectedTemple) return false;
      return true;
    });

    // 8) Re‐render
    this.renderThumbnails(this.filteredSKUs);
  },

  // Clear all filters back to “All”/blank
  clearFilters() {
    document.getElementById('filter-color').selectedIndex = -1;
    document.getElementById('filter-material').value = '';
    document.getElementById('filter-eyesize').value = '';
    document.getElementById('filter-b').value = '';
    document.getElementById('filter-pd-exact').value = '';
    document.getElementById('filter-pd-min').value = '';
    document.getElementById('filter-pd-max').value = '';
    document.getElementById('filter-temple').value = '';
  },

  // Render the thumbnail grid (one card per unique FrameName)
  renderThumbnails(skuArray) {
    const thumbContainer = document.getElementById('thumbnails');
    thumbContainer.innerHTML = ''; // Clear existing

    // 1) Group SKUs by FrameName
    const groups = new Map();
    skuArray.forEach(rec => {
      const name = rec.FrameName;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(rec);
    });

    // 2) For each group, pick a representative image and build a small object
    const frameGroups = [];
    groups.forEach((skuList, frameName) => {
      let repImg = '';
      if (skuList.length > 0) {
        repImg = skuList[0].HeroImage || '';
      }
      const imgPath = repImg ? `images/${repImg}` : 'images/coming-soon.jpg';
      frameGroups.push({
        frameName,
        skus: skuList,
        representativeImage: imgPath
      });
    });

    // 3) Sort so that frames with “coming-soon” appear last
    frameGroups.sort((a, b) => {
      return a["Frame Name"].localCompare(b["Frame Name"]);
    });

    // 4) Clone thumbnail-template for each group and populate
    const template = document.getElementById('thumbnail-template');
    frameGroups.forEach(group => {
      const clone = template.content.cloneNode(true);
      const link = clone.querySelector('.thumb-link');
      const img  = clone.querySelector('.thumb-img');
      const name = clone.querySelector('.thumb-name');

      // Link to details.html?frame=FRAME_NAME
      link.href = `details.html?frame=${encodeURIComponent(group.frameName)}`;
      // Image src
      img.src = group.representativeImage;
      img.alt = group.frameName;
      // Frame name
      name.textContent = group.frameName;

      thumbContainer.appendChild(clone);
    });
  },

  // -------------------------------------------------------------------------
  // DETAIL‐PAGE METHODS (details.html)
  // -------------------------------------------------------------------------

  /**
   * Read a query parameter by name (e.g. getQueryParam("frame")).
   */
  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  /**
   * Initializes the detail page. Called on DOMContentLoaded in details.html.
   */
  async initDetailPage() {
    try {
      // 1) Read ?frame= from URL
      const frameNameParam = getQueryParam('frame'); 
      //                                                            ↑ fixed: not this.getQueryParam
      if (!frameNameParam) {
        document.getElementById('frame-name').textContent = "No frame specified";
        return;
      }

      // 2) Load JSON if not already done
      if (!this.allSKUs || this.allSKUs.length === 0) {
        this.allSKUs = await this.loadAllFrames();
      }
      // Filter out discontinued
      const activeSKUs = this.allSKUs.filter(sku => sku.Discontinued === false);

      // 3) Keep only SKUs for this FrameName
      this.currentFrameSKUs = activeSKUs.filter(
        rec => rec.FrameName === frameNameParam
      );

      // 4) Update the page’s <h1>
      document.getElementById('frame-name').textContent = frameNameParam;

      // 5) Build Color & Eye Size dropdowns (auto‐select first valid values)
      this.buildDetailSelectors();

      // 6) Populate the SKU table
      this.renderSKUDetailsTable();

      // 7) Now that both dropdowns have valid selections, show that SKU’s image
      this.onDetailSelectorChange();

      // 8) Back to Catalog button
      document.getElementById('back-button')
              .addEventListener('click', () => { window.location.href = 'index.html'; });

    } catch (err) {
      console.error("Error in initDetailPage:", err);
    }
  },

  /**
   * Build the two dropdowns (#select-color & #select-eyesize) from currentFrameSKUs.
   * No placeholder option—immediately select the first real color & size.
   */
  buildDetailSelectors() {
    // 1) Distinct colors
    const colorSet = new Set();
    this.currentFrameSKUs.forEach(rec => {
      if (rec.Color) colorSet.add(rec.Color);
    });
    const allColors = Array.from(colorSet).sort((a, b) => a.localeCompare(b));

    // 2) Distinct eye sizes
    const eyeSet = new Set();
    this.currentFrameSKUs.forEach(rec => {
      if (rec.EyeSize !== undefined && rec.EyeSize !== null) eyeSet.add(rec.EyeSize);
    });
    const allEyeSizes = Array.from(eyeSet).sort((a, b) => a - b);

    // 3) Populate Color dropdown
    const colorSel = document.getElementById('select-color');
    colorSel.innerHTML = ''; // Clear old options
    allColors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      colorSel.appendChild(opt);
    });
    // Select the first color by default
    if (allColors.length > 0) {
      colorSel.value = allColors[0];
    }

    // 4) Populate Eye Size dropdown
    const eyeSel = document.getElementById('select-eyesize');
    eyeSel.innerHTML = '';
    allEyeSizes.forEach(sz => {
      const opt = document.createElement('option');
      opt.value = sz;
      opt.textContent = sz;
      eyeSel.appendChild(opt);
    });
    // Select the first eye size by default
    if (allEyeSizes.length > 0) {
      eyeSel.value = allEyeSizes[0];
    }

    // 5) Hook change events—any change updates the main image
    colorSel.addEventListener('change', () => this.onDetailSelectorChange());
    eyeSel.addEventListener('change', () => this.onDetailSelectorChange());
  },

  /**
   * Called whenever Color or Eye Size changes.
   * Finds the matching SKU (Color + EyeSize) and updates the main image & overlay.
   * If no match, shows “coming-soon.”
   */
  onDetailSelectorChange() {
    const chosenColor = document.getElementById('select-color').value;
    const chosenEyeSizeStr = document.getElementById('select-eyesize').value;
    const chosenEyeSize = parseInt(chosenEyeSizeStr, 10);

    // Find the first SKU object that matches both selections
    const idx = this.currentFrameSKUs.findIndex(rec => {
      return rec.Color === chosenColor && rec.EyeSize === chosenEyeSize;
    });

    if (idx >= 0) {
      this.currentSKUIndex = idx;
      this.updateImageDisplay();
    } else {
      // No matching SKU → show placeholder
      this.currentSKUIndex = null;
      this.showComingSoon();
    }
  },

  /**
   * Populate the SKU table (one row per SKU) under #sku-table.
   */
  renderSKUDetailsTable() {
    const tbody = document.getElementById('sku-table').querySelector('tbody');
    tbody.innerHTML = ''; // Clear old rows

    this.currentFrameSKUs.forEach(rec => {
      const row = document.createElement('tr');

      // SKU
      const tdSKU = document.createElement('td');
      tdSKU.textContent = rec.SKU;
      row.appendChild(tdSKU);

      // Color
      const tdColor = document.createElement('td');
      tdColor.textContent = rec.Color;
      row.appendChild(tdColor);

      // Eye Size
      const tdEye = document.createElement('td');
      tdEye.textContent = rec.EyeSize;
      row.appendChild(tdEye);

      // B
      const tdB = document.createElement('td');
      tdB.textContent = rec.B;
      row.appendChild(tdB);

      // Frame PD
      const tdPD = document.createElement('td');
      tdPD.textContent = rec.FramePD;
      row.appendChild(tdPD);

      // Temple
      const tdTemple = document.createElement('td');
      tdTemple.textContent = rec.Temple;
      row.appendChild(tdTemple);

      // Back Ordered
      const tdBO = document.createElement('td');
      tdBO.textContent = rec.BackOrdered ? "Yes" : "No";
      row.appendChild(tdBO);

      tbody.appendChild(row);
    });
  },

  /**
   * Update the main <img id="frame-image"> and BACK ORDERED overlay.
   * Also build the extra‐views gallery thumbnails under #view-thumbnails.
   */
  updateImageDisplay() {
    const imgEl = document.getElementById('frame-image');
    const overlayEl = document.getElementById('bo-overlay');
    const galleryContainer = document.getElementById('view-thumbnails');

    // Clear out the old gallery thumbnails
    galleryContainer.innerHTML = "";

    if (this.currentSKUIndex === null) {
      // Show the “coming-soon” placeholder
      this.showComingSoon();
      return;
    }

    const skuRec = this.currentFrameSKUs[this.currentSKUIndex];
    const heroFile = skuRec.HeroImage || "";
    const heroPath = heroFile ? `images/${heroFile}` : "";

    // 1) First, set the main image (HeroImage) using setMainImage helper
    this.setMainImage(heroPath, skuRec.BackOrdered);

    // 2) Build the extra‐views gallery if any exist
    if (Array.isArray(skuRec.Images) && skuRec.Images.length > 0) {
      skuRec.Images.forEach((imgObj, idx) => {
        const thumb = document.createElement('img');
        thumb.src = `images/${imgObj.filename}`;
        thumb.alt = imgObj.view;
        thumb.classList.add('view-thumb');
        // When clicked, swap the main image to this extra‐view
        thumb.addEventListener('click', () => {
          this.setMainImage(`images/${imgObj.filename}`, skuRec.BackOrdered);
          // Visually indicate which thumbnail is selected
          galleryContainer.querySelectorAll('.view-thumb').forEach(img => {
            img.classList.remove('selected');
          });
          thumb.classList.add('selected');
        });
        galleryContainer.appendChild(thumb);
      });
      // We do not automatically mark any thumbnail “selected” here,
      // because the HeroImage might not be in skuRec.Images array.
    }
    // If skuRec.Images is empty, galleryContainer stays empty and is hidden by CSS.
  },

  /**
   * Helper to set the main image and BACK ORDERED overlay.
   * Tries to load imgPath; if it fails, uses coming‐soon.jpg.
   * If backOrdered === true, shows overlay; otherwise hides it.
   */
  setMainImage(imgPath, backOrdered) {
    const imgEl = document.getElementById('frame-image');
    const overlayEl = document.getElementById('bo-overlay');

    if (!imgPath) {
      // No path provided → immediate fallback
      imgEl.src = 'images/coming-soon.jpg';
      imgEl.alt = "Image coming soon";
      overlayEl.classList.add('hidden');
      return;
    }

    const testImg = new Image();
    testImg.onload = () => {
      // File exists → set it
      imgEl.src = imgPath;
      // If this SKU is back‐ordered, show overlay
      if (backOrdered) overlayEl.classList.remove('hidden');
      else overlayEl.classList.add('hidden');
    };
    testImg.onerror = () => {
      // File missing → fallback
      imgEl.src = 'images/coming-soon.jpg';
      imgEl.alt = "Image coming soon";
      overlayEl.classList.add('hidden');
    };
    testImg.src = imgPath;
  },

  /**
   * Show the “coming-soon” image and hide the overlay.
   */
  showComingSoon() {
    const imgEl = document.getElementById('frame-image');
    const overlayEl = document.getElementById('bo-overlay');
    imgEl.src = 'images/coming-soon.jpg';
    imgEl.alt = "Image coming soon";
    overlayEl.classList.add('hidden');
  }
};

// A standalone function to read URL query parameters
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
