import { fetchFramesData } from './data-loader.js';
import { getQueryParam, getById, clearChildren } from './utils.js';

export async function initDetailPage() {
  const frameName = getQueryParam('frame');
  if (!frameName) return;

  getById('frame-name').textContent = frameName;
  getById('back-button').addEventListener('click',()=>history.back());

  try {
    const data = await fetchFramesData();
    const skus = data.filter(s=>s.FrameName===frameName);
    if (!skus.length) {
      document.body.innerHTML = '<p class="error">Frame not found.</p>';
      return;
    }
    setupSelectors(skus);
    injectDetailSections();
    updateVariant(skus);
  } catch (err) {
    console.error(err);
    document.body.innerHTML = '<p class="error">Failed to load frame details.</p>';
  }
}

function setupSelectors(skus) {
  const sel = getById('selectors');
  const colors = [...new Set(skus.map(s=>s.Color))];
  const sizes  = [...new Set(skus.map(s=>String(s.EyeSize)))].sort((a,b)=>a-b);
  sel.innerHTML = `
    <label for="detail-color">Color:</label>
    <select id="detail-color">${colors.map(c=>`<option>${c}</option>`).join('')}</select>
    <label for="detail-size">Eye Size:</label>
    <select id="detail-size">${sizes.map(s=>`<option>${s}</option>`).join('')}</select>
  `;
  ['detail-color','detail-size'].forEach(id=>{
    getById(id).addEventListener('change',()=>updateVariant(skus));
  });
}

function injectDetailSections() {
  const main = document.querySelector('main');
  main.insertAdjacentHTML('beforeend',`
    <section id="gallery">
      <div id="detail-main-image-container">
        <img id="detail-main-image" src="" alt="" />
        <div id="bo-overlay" class="hidden">BACK ORDERED</div>
      </div>
      <div id="gallery-thumbs"></div>
    </section>
    <section id="sku-table">
      <table>
        <thead><tr><th>Color</th><th>Eye Size</th><th>B</th><th>PD</th><th>Temple</th><th>Back Ordered</th></tr></thead>
        <tbody id="sku-table-body"></tbody>
      </table>
    </section>
  `);
}

function updateVariant(skus) {
  const color = getById('detail-color').value;
  const size  = getById('detail-size').value;
  const variant = skus.find(s=>s.Color===color && String(s.EyeSize)===size);
  if (!variant) return;
  renderImage(variant);
  renderTable(skus);
}

function renderImage(variant) {
  const mainImg = getById('detail-main-image');
  mainImg.src = `images/${variant.HeroImage}`;
  getById('bo-overlay').classList.toggle('hidden', !variant.BackOrdered);

  const thumbs = getById('gallery-thumbs');
  clearChildren(thumbs);
  (variant.ExtraImages||[]).forEach(fn=>{
    const img = document.createElement('img');
    img.src = `images/${fn}`;
    img.className = 'gallery-thumb';
    img.alt = '';
    img.addEventListener('click',()=> mainImg.src = `images/${fn}`);
    thumbs.appendChild(img);
  });
}

function renderTable(skus) {
  const tbody = getById('sku-table-body');
  clearChildren(tbody);
  skus.forEach(sku=>{
    const tr = document.createElement('tr');
    ['Color','EyeSize','B','FramePD','Temple'].forEach(prop=>{
      const td = document.createElement('td'); td.textContent = sku[prop]; tr.appendChild(td);
    });
    const boTd = document.createElement('td');
    boTd.textContent = sku.BackOrdered ? 'Yes' : 'No';
    tr.appendChild(boTd);
    tbody.appendChild(tr);
  });
}