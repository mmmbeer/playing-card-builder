const DEFAULT_PATH = 'docs/guided-tour.json';

export async function loadTutorialConfig(path = DEFAULT_PATH) {
  try {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !Array.isArray(data.steps)) return null;
    return data;
  } catch (err) {
    return null;
  }
}
