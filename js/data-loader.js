function normalizeName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

const IMAGE_NAME_ALIASES = {
  'DC_391_56_BLACK_GOLD_Hero.jpg': 'DC_391_56_ BLACK_GOLD_Hero.jpg',
  'DC_391_56_GOLD_Hero.jpg': 'DC_391_56_ GOLD_Hero.jpg',
  'EN_4350_53_SH_GRAY_CR/MA_BLK_Hero.jpg': 'EN_4350_53_SH_GRAY_CR-MA_BLK_Hero.jpg',
  'FX_119_52_Burgundy_Hero.jpg': 'FX_119_52_BURGUNDY_Hero.jpg',
  'FX_119_52_Rose_Hero.jpg': 'FX_119_52_ROSE_Hero.jpg',
  'GR827-Black Gold-Hero.JPG': 'GR827 Black Gold-Hero.jpg',
  'GR827-Black Silver-Hero.jpg': 'GR827 Black Silver-Hero.jpg',
  'GR827-Blue Gunmetal-Hero.JPG': 'GR827 Blue Gunmetal-Hero.jpg',
  'H4903-DEMI-BLUE-HERO.JPG': 'H4903-Demi-Blue-Hero.jpg',
  'H4903-DEMI-BROWN-HERO.JPG': 'H4903-Demi-Brown-Hero.jpg',
  'H4903-DEMI-MAUVE-HERO.JPG': 'H4903-Demi-Mauve-Hero.jpg',
  'H4922-Blue-Fade-Hero.JPG': 'H4922-Blue-Fade-Hero.jpg',
  'H4922-Brown-Fade-Hero.JPG': 'H4922-Brown-Fade-Hero.jpg',
  'H4922-Green-Fade-Hero.JPG': 'H4922-Green-Fade-Hero.jpg',
  'H4922-Smoke-Fade-Hero.JPG': 'H4922-Smoke-Fade-Hero.jpg',
  'HAC_109_54_BLACK/RED_Hero.jpg': 'HAC_109_54_BLACK-RED_Hero.jpg',
  'MC_6278_52_SATIN_RED_GOLD_Hero.jpg': 'MC_6278_52_SATIN_RED-GOLD_Hero.jpg',
  'SL101 Brown-Hero.JPG': 'SL101 Brown-Hero.jpg',
  'SL101 Gunmetal-Hero.JPG': 'SL101 Gunmetal-Hero.jpg',
  'U213 Blue-HERO.JPG': 'U213 Blue-Hero.jpg',
  'U213 Crystal-HERO.JPG': 'U213 Crystal-Hero.jpg',
  'U213 black-HERO.JPG': 'U213 black-Hero.jpg',
  'U213 blue-HERO.JPG': 'U213 Blue-Hero.jpg',
  'VERTEX_48_NAVY_Hero.jpg': 'VERTEX__48_NAVY_Hero.jpg'
};

function normalizeLabel(value) {
  return String(value || '').replace(/[_-]+/g, '/').replace(/\s+/g, ' ').trim();
}

function inferType(frame) {
  if (frame.safety || String(frame.Material || '').toLowerCase() === 'safety') return 'Safety';
  if (frame.sport || String(frame.Material || '').toLowerCase() === 'sport') return 'Sport';
  return 'Standard';
}

function normalizeFrame(frame) {
  const frameName = normalizeName(frame.FrameName);
  const material = normalizeName(frame.Material);
  const color = normalizeLabel(frame.Color);
  const colorTags = (Array.isArray(frame.ColorTags) && frame.ColorTags.length ? frame.ColorTags : [color])
    .map(normalizeLabel)
    .filter(Boolean);

  return {
    ...frame,
    FrameName: frameName,
    Material: material,
    Color: color,
    ColorTags: [...new Set(colorTags)],
    EyeSize: Number(frame.EyeSize),
    DBL: Number(frame.DBL),
    B: Number(frame.B),
    Temple: Number(frame.Temple),
    FramePD: Number(frame.FramePD),
    BackOrdered: Boolean(frame.BackOrdered),
    HeroImage: normalizeName(frame.HeroImage) || 'coming-soon.jpg',
    Images: Array.isArray(frame.Images) ? frame.Images.map(normalizeName).filter(Boolean) : [],
    type: inferType(frame)
  };
}

// Fetch frames.json and filter out discontinued variants.
export async function fetchFramesData() {
  const resp = await fetch('data/frames.json');
  if (!resp.ok) throw new Error('Failed to load frames.json');
  const frames = await resp.json();
  return frames.filter(frame => !frame.Discontinued).map(normalizeFrame);
}

export function getImagePath(fileName) {
  if (!fileName) return 'images/coming-soon.jpg';

  const resolvedName = IMAGE_NAME_ALIASES[fileName] || fileName;
  return `images/${resolvedName}`;
}
