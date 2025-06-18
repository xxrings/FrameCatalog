import { clearChildren } from './utils.js';

// Fetch frames.json and filter out discontinued
export async function fetchFramesData() {
  const resp = await fetch('data/frames.json');
  if (!resp.ok) throw new Error('Failed to load frames.json');
  const frames = await resp.json();
  return frames.filter(f => !f.Discontinued);
}