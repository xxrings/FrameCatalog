import { renderThumbnails } from './thumbnails.js';
import { getFilterState, applyFilterLogic } from './filters.js';
import { getById } from './utils.js';

export function hookFilterEvents(allFrames) {
  // dropdown toggle
  document.querySelectorAll('.multi-dropdown').forEach(drop=>{
    const btn = drop.querySelector('.multi-dropdown-btn');
    btn.addEventListener('click',()=>drop.classList.toggle('open'));
  });
  document.addEventListener('click',e=>{
    document.querySelectorAll('.multi-dropdown').forEach(drop=>{
      if (!drop.contains(e.target)) drop.classList.remove('open');
    });
  });

  // apply
  getById('filter-apply').addEventListener('click',()=>{
    const state = getFilterState();
    const filtered = applyFilterLogic(allFrames, state);
    renderThumbnails(filtered);
  });

  // clear
  getById('filter-clear').addEventListener('click',()=>{
    getById('filter-search').value = '';
    document.querySelectorAll('#filters input[type="checkbox"]').forEach(cb=>cb.checked=false);
    renderThumbnails(allFrames);
  });

  // live search
  getById('filter-search').addEventListener('input',()=>{
    const state = getFilterState();
    renderThumbnails(applyFilterLogic(allFrames, state));
  });
}