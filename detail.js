// detail.js
// Frame details page logic: image gallery + specs table

// Only run on the details page (checks for necessary elements)
document.addEventListener('DOMContentLoaded', initDetailPage);

function initDetailPage() {
  const selectorsSection = document.getElementById('selectors');
  const backBtn = document.getElementById('back-button');
  const frameNameEl = document.getElementById('frame-name');
  if (!selectorsSection || !backBtn || !frameNameEl) return;

  // Read frame name from query param
  const params = new URLSearchParams(window.location.search);
  const frameName = params.get('frame');
  if (!frameName) return;

  frameNameEl.textContent = frameName;
  backBtn.addEventListener('click', () => history.back());

  // Load JSON and build page
  fetch('data/frames.json')
    .then(res => res.json())
    .then(data => {
      const skus = data.filter(item => !item.Discontinued && item.FrameName === frameName);
      if (!skus.length) {
        document.body.innerHTML = '<p class="error">Frame not found.</p>';
        return;
      }
      setupSelectors(skus);
      buildGalleryAndTable(skus);
    })
    .catch(err => {
      console.error(err);
      document.body.innerHTML = '<p class="error">Failed to load frame details.</p>';
    });
}

function setupSelectors(skus) {
  const sel = document.getElementById('selectors');
  const colors = [...new Set(skus.map(s => s.Color))].sort();
  const sizes  = [...new Set(skus.map(s => s.EyeSize))].sort((a,b) => a - b);

  let html = '';
  html += '<label for="detail-color">Color:</label>';
  html += '<select id="detail-color">';
  colors.forEach(c => html += `<option value="${c}">${c}</option>`);
  html += '</select>';

  html += '<label for="detail-size">Eye Size:</label>';
  html += '<select id="detail-size">';
  sizes.forEach(sz => html += `<option value="${sz}">${sz}</option>`);
  html += '</select>';

  sel.innerHTML = html;

  document.getElementById('detail-color').addEventListener('change', () => updateVariant(skus));
  document.getElementById('detail-size').addEventListener('change', () => updateVariant(skus));
}

function buildGalleryAndTable(skus) {
  const sel = document.getElementById('selectors');
  sel.insertAdjacentHTML('afterend', `
    <section id="gallery">
      <div id="detail-main-image-container">
        <img id="detail-main-image" src="" alt="Frame Image" />
        <div id="bo-overlay" class="overlay hidden">BACK ORDERED</div>
      </div>
      <div id="gallery-thumbs"></div>
    </section>
    <section id="sku-table">
      <table>
        <thead>
          <tr><th>Color</th><th>Eye Size</th><th>B</th><th>PD</th><th>Temple</th><th>Back Ordered</th></tr>
        </thead>
        <tbody id="sku-table-body"></tbody>
      </table>
    </section>
  `);
  updateVariant(skus);
}

function updateVariant(skus) {
  const colorVal = document.getElementById('detail-color').value;
  const sizeVal  = document.getElementById('detail-size').value;
  const variant = skus.find(s => s.Color === colorVal && String(s.EyeSize) === sizeVal);
  if (!variant) return;

  renderImage(variant);
  renderTable(skus);
}

function renderImage(variant) {
  const mainImg = document.getElementById('detail-main-image');
  mainImg.src = `images/${variant.HeroImage}`;
  document.getElementById('bo-overlay').classList.toggle('hidden', !variant.BackOrdered);

  const thumbs = document.getElementById('gallery-thumbs');
  thumbs.innerHTML = '';
  (variant.ExtraImages || []).forEach(fn => {
    const thumb = document.createElement('img');
    thumb.src = `images/${fn}`;
    thumb.className = 'gallery-thumb';
    thumb.alt = '';
    thumb.addEventListener('click', () => mainImg.src = `images/${fn}`);
    thumbs.appendChild(thumb);
  });
}

function renderTable(skus) {
  const tbody = document.getElementById('sku-table-body');
  tbody.innerHTML = '';
  skus.forEach(sku => {
    const tr = document.createElement('tr');
    ['Color', 'EyeSize', 'B', 'FramePD', 'Temple'].forEach(prop => {
      const td = document.createElement('td');
      td.textContent = sku[prop];
      tr.appendChild(td);
    });
    const boTd = document.createElement('td');
    boTd.textContent = sku.BackOrdered ? 'Yes' : 'No';
    tr.appendChild(boTd);
    tbody.appendChild(tr);
  });
}
