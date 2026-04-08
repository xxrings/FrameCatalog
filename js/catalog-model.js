import { groupBy, uniqSorted, formatCount, formatRange } from './utils.js';
import { getImagePath } from './data-loader.js';

const NUMERIC_COMPARE = (a, b) => a - b;

function firstAvailableImage(variants) {
  const match = variants.find(variant => variant.HeroImage && variant.HeroImage !== 'coming-soon.jpg');
  return match?.HeroImage || 'coming-soon.jpg';
}

function buildSearchText(item) {
  return [
    item.name,
    ...item.materials,
    ...item.types,
    ...item.colors,
    ...item.variantColors,
    ...item.eyeSizes.map(String),
    ...item.pds.map(String),
    ...item.temples.map(String),
    ...item.bs.map(String)
  ]
    .join(' ')
    .toLowerCase();
}

export function buildCatalogItems(frames) {
  return Object.entries(groupBy(frames, frame => frame.FrameName))
    .map(([, variants]) => {
      const eyeSizes = uniqSorted(variants.map(variant => variant.EyeSize), NUMERIC_COMPARE);
      const pds = uniqSorted(variants.map(variant => variant.FramePD), NUMERIC_COMPARE);
      const temples = uniqSorted(variants.map(variant => variant.Temple), NUMERIC_COMPARE);
      const bs = uniqSorted(variants.map(variant => variant.B), NUMERIC_COMPARE);
      const materials = uniqSorted(variants.map(variant => variant.Material));
      const types = uniqSorted(variants.map(variant => variant.type));
      const colors = uniqSorted(variants.flatMap(variant => variant.ColorTags));
      const variantColors = uniqSorted(variants.map(variant => variant.Color));
      const representative = variants.find(variant => variant.HeroImage && variant.HeroImage !== 'coming-soon.jpg') || variants[0];
      const materialLabel = materials.length === 1 ? materials[0] : 'Mixed materials';
      const statusLabel = variants.some(variant => variant.BackOrdered) ? 'Includes backorders' : '';

      const item = {
        name: variants[0].FrameName,
        variants: [...variants].sort((left, right) => {
          if (left.EyeSize !== right.EyeSize) return left.EyeSize - right.EyeSize;
          return left.Color.localeCompare(right.Color);
        }),
        eyeSizes,
        pds,
        temples,
        bs,
        materials,
        materialLabel,
        types,
        colors,
        variantColors,
        colorCount: colors.length,
        image: getImagePath(firstAvailableImage(variants)),
        imageAlt: `${variants[0].FrameName} eyeglass frame in ${representative?.Color || 'featured color'}`,
        statusLabel,
        hasBackOrdered: variants.some(variant => variant.BackOrdered),
        heroVariant: representative,
        variantCount: variants.length,
        sizeLabel: eyeSizes.length > 1 ? `${formatRange(eyeSizes)} eye` : `${eyeSizes[0]} eye`,
        pdLabel: pds.length > 1 ? `${formatRange(pds)} PD` : `${pds[0]} PD`,
        templeLabel: temples.length > 1 ? `${formatRange(temples)} mm temple` : `${temples[0]} mm temple`,
        summary: `${formatCount(colors.length, 'color')} across ${formatCount(eyeSizes.length, 'size')}`,
        searchText: ''
      };

      item.searchText = buildSearchText(item);
      return item;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getFilterOptions(items) {
  return {
    types: uniqSorted(items.flatMap(item => item.types)),
    materials: uniqSorted(items.flatMap(item => item.materials)),
    colors: uniqSorted(items.flatMap(item => item.colors)),
    eyeSizes: uniqSorted(items.flatMap(item => item.eyeSizes), NUMERIC_COMPARE),
    pds: uniqSorted(items.flatMap(item => item.pds), NUMERIC_COMPARE),
    temples: uniqSorted(items.flatMap(item => item.temples), NUMERIC_COMPARE)
  };
}

export function filterCatalogItems(items, state) {
  return items.filter(item => {
    if (state.term && !item.searchText.includes(state.term)) return false;
    if (state.types.length && !state.types.some(type => item.types.includes(type))) return false;
    if (state.materials.length && !state.materials.some(material => item.materials.includes(material))) return false;
    if (state.colors.length && !state.colors.some(color => item.colors.includes(color))) return false;
    if (state.eyeSizes.length && !state.eyeSizes.some(size => item.eyeSizes.includes(Number(size)))) return false;
    if (state.pds.length && !state.pds.some(pd => item.pds.includes(Number(pd)))) return false;
    if (state.temples.length && !state.temples.some(temple => item.temples.includes(Number(temple)))) return false;
    return true;
  });
}

export function sortCatalogItems(items, sortBy) {
  const sorted = [...items];

  switch (sortBy) {
    case 'size-asc':
      sorted.sort((left, right) => left.eyeSizes[0] - right.eyeSizes[0] || left.name.localeCompare(right.name));
      break;
    case 'size-desc':
      sorted.sort(
        (left, right) =>
          right.eyeSizes[right.eyeSizes.length - 1] - left.eyeSizes[left.eyeSizes.length - 1] ||
          left.name.localeCompare(right.name)
      );
      break;
    case 'pd-asc':
      sorted.sort((left, right) => left.pds[0] - right.pds[0] || left.name.localeCompare(right.name));
      break;
    case 'colors-desc':
      sorted.sort((left, right) => right.colorCount - left.colorCount || left.name.localeCompare(right.name));
      break;
    case 'name-desc':
      sorted.sort((left, right) => right.name.localeCompare(left.name));
      break;
    case 'name-asc':
    default:
      sorted.sort((left, right) => left.name.localeCompare(right.name));
      break;
  }

  return sorted;
}
