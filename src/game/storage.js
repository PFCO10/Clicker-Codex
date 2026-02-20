const KEY = 'neon-idle-forge-save-v1';

export const saveGame = (state) => {
  localStorage.setItem(KEY, JSON.stringify(state));
};

export const loadGame = () => {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Backend-ready adapter shape: replace with API calls while keeping game engine API stable.
export const progressRepository = {
  load: loadGame,
  save: saveGame,
};
