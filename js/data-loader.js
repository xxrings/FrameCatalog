function normalizeName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

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
  return fileName ? `images/${fileName}` : 'images/coming-soon.jpg';
}
