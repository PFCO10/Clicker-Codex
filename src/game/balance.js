export const THEMES = {
  aiFactory: {
    name: 'AI Factory',
    accent: '#65f5ff',
    glow: 'rgba(101,245,255,0.6)',
    object: 'Neural Core',
  },
  spaceMining: {
    name: 'Space Mining',
    accent: '#aab1ff',
    glow: 'rgba(170,177,255,0.6)',
    object: 'Quantum Asteroid',
  },
  fantasyCore: {
    name: 'Fantasy Core',
    accent: '#9eff8b',
    glow: 'rgba(158,255,139,0.6)',
    object: 'Arcane Crystal',
  },
  startupGrid: {
    name: 'Startup Grid',
    accent: '#ff9cf3',
    glow: 'rgba(255,156,243,0.6)',
    object: 'Server Node',
  },
};

export const GENERATORS = [
  { id: 'intern', name: 'Intern Bot', baseCost: 25, baseCps: 0.6 },
  { id: 'drone', name: 'Assembly Drone', baseCost: 180, baseCps: 4 },
  { id: 'cluster', name: 'Compute Cluster', baseCost: 1800, baseCps: 32 },
  { id: 'fabricator', name: 'Nano Fabricator', baseCost: 15000, baseCps: 220 },
  { id: 'orbital', name: 'Orbital Relay', baseCost: 120000, baseCps: 1250 },
];

export const UPGRADE_GROUPS = {
  click: [
    { id: 'click-1', name: 'Haptic Tuning', baseCost: 100, value: 1.35 },
    { id: 'click-2', name: 'Pulse Compression', baseCost: 1200, value: 1.5 },
    { id: 'click-3', name: 'Neon Overcharge', baseCost: 9000, value: 1.8 },
  ],
  production: [
    { id: 'prod-1', name: 'Parallel Logistics', baseCost: 140, value: 1.3 },
    { id: 'prod-2', name: 'Predictive Routing', baseCost: 1800, value: 1.6 },
    { id: 'prod-3', name: 'Hyper Automation', baseCost: 14000, value: 1.9 },
  ],
  crit: [
    { id: 'crit-1', name: 'Targeting Lens', baseCost: 240, value: 0.03 },
    { id: 'crit-2', name: 'Quantum Insight', baseCost: 2600, value: 0.05 },
    { id: 'crit-3', name: 'Perfect Timing', baseCost: 24000, value: 0.08 },
  ],
};

export const SKILL_TREE = [
  { id: 'root', name: 'Bootstrap Logic', desc: '+15% all gains', cost: 2, requires: [], effect: { all: 1.15 } },
  { id: 'left-1', name: 'Kinetic Hands', desc: '+35% click power', cost: 3, requires: ['root'], effect: { click: 1.35 } },
  { id: 'left-2', name: 'Lucky Sparks', desc: '+8% crit chance', cost: 4, requires: ['left-1'], effect: { crit: 0.08 } },
  { id: 'right-1', name: 'Factory Sync', desc: '+35% auto output', cost: 3, requires: ['root'], effect: { production: 1.35 } },
  { id: 'right-2', name: 'Temporal Cache', desc: '+40% offline gains', cost: 4, requires: ['right-1'], effect: { offline: 1.4 } },
  { id: 'capstone', name: 'Singularity Planning', desc: '+25% all gains', cost: 8, requires: ['left-2', 'right-2'], effect: { all: 1.25 } },
];

export const ABILITIES = [
  {
    id: 'frenzy',
    name: 'Frenzy Loop',
    desc: '3x click value for 15s',
    durationMs: 15000,
    cooldownMs: 70000,
    effect: { click: 3 },
  },
  {
    id: 'surge',
    name: 'Surge Protocol',
    desc: '2.5x production for 20s',
    durationMs: 20000,
    cooldownMs: 90000,
    effect: { production: 2.5 },
  },
];

export const ACHIEVEMENTS = [
  { id: 'ach-first', title: 'Sparked', check: (s) => s.totalClicks >= 1, reward: { flat: 25 } },
  { id: 'ach-100', title: 'Centurion', check: (s) => s.totalClicks >= 100, reward: { click: 1.15 } },
  { id: 'ach-gen', title: 'Automation Age', check: (s) => s.totalGenerators >= 25, reward: { production: 1.15 } },
  { id: 'ach-rich', title: 'Seven Digits', check: (s) => s.currency >= 1_000_000, reward: { all: 1.12 } },
  { id: 'ach-rebirth', title: 'Reborn', check: (s) => s.prestigeLevel >= 1, reward: { all: 1.2 } },
];

export const ECONOMY = {
  generatorCostGrowth: 1.16,
  prestigeExponent: 0.42,
  recoveryBonus: 0.015,
  recoveryTickMs: 10000,
  eventIntervalMs: 35000,
};

export const format = (value) => {
  if (value < 1000) return value.toFixed(1);
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let n = value;
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i += 1;
  }
  return `${n.toFixed(2)}${units[i]}`;
};
