import { ABILITIES, GENERATORS, THEMES } from './balance';

export const createBaseState = () => ({
  theme: 'aiFactory',
  currency: 0,
  lifetimeCurrency: 0,
  totalClicks: 0,
  clickPower: 1,
  clickMultiplier: 1,
  productionMultiplier: 1,
  critChance: 0.05,
  critMultiplier: 2,
  generators: Object.fromEntries(GENERATORS.map((g) => [g.id, 0])),
  upgradeLevels: {},
  prestigeLevel: 0,
  prestigePoints: 0,
  spentPrestige: 0,
  skillNodes: [],
  achievements: [],
  achievementBoost: { click: 1, production: 1, all: 1, flat: 0 },
  activeEffects: {},
  abilityState: Object.fromEntries(ABILITIES.map((a) => [a.id, { readyAt: 0, endsAt: 0 }])),
  daily: { streak: 0, lastClaimDay: 0 },
  randomEvent: null,
  randomEventEndsAt: 0,
  totalGenerators: 0,
  themeMeta: THEMES.aiFactory,
  lastTick: Date.now(),
  lastSave: Date.now(),
  offlineBoost: 1,
  recoveryMeter: 0,
});

export const hydrateState = (saved) => {
  const base = createBaseState();
  if (!saved || typeof saved !== 'object') return base;

  const theme = saved.theme && THEMES[saved.theme] ? saved.theme : base.theme;

  return {
    ...base,
    ...saved,
    theme,
    themeMeta: THEMES[theme],
    generators: { ...base.generators, ...(saved.generators || {}) },
    upgradeLevels: { ...base.upgradeLevels, ...(saved.upgradeLevels || {}) },
    daily: { ...base.daily, ...(saved.daily || {}) },
    achievementBoost: { ...base.achievementBoost, ...(saved.achievementBoost || {}) },
    abilityState: {
      ...base.abilityState,
      ...Object.fromEntries(
        Object.entries(saved.abilityState || {}).map(([id, value]) => [
          id,
          { ...base.abilityState[id], ...value },
        ]),
      ),
    },
  };
};
