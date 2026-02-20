import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ABILITIES,
  ACHIEVEMENTS,
  ECONOMY,
  GENERATORS,
  SKILL_TREE,
  THEMES,
  UPGRADE_GROUPS,
} from './balance';
import { createBaseState, hydrateState } from './defaultState';
import { progressRepository } from './storage';

const dayStamp = () => Math.floor(Date.now() / 86400000);

const applyMulti = (v, muls) => muls.reduce((n, m) => n * m, v);

export const useGameEngine = () => {
  const [state, setState] = useState(() => hydrateState(progressRepository.load()));
  const [floaters, setFloaters] = useState([]);
  const audioRef = useRef(null);

  const skillEffects = useMemo(() => {
    const effects = { click: 1, production: 1, all: 1, crit: 0, offline: 1 };
    SKILL_TREE.filter((n) => state.skillNodes.includes(n.id)).forEach((node) => {
      if (node.effect.click) effects.click *= node.effect.click;
      if (node.effect.production) effects.production *= node.effect.production;
      if (node.effect.all) effects.all *= node.effect.all;
      if (node.effect.crit) effects.crit += node.effect.crit;
      if (node.effect.offline) effects.offline *= node.effect.offline;
    });
    return effects;
  }, [state.skillNodes]);

  const generatorCps = useMemo(
    () =>
      GENERATORS.reduce((sum, g) => {
        sum += (state.generators[g.id] || 0) * g.baseCps;
        return sum;
      }, 0),
    [state.generators],
  );

  const minUpgradeCost = useMemo(() => {
    const generatorMin = GENERATORS.reduce((min, g) => {
      const cost = g.baseCost * Math.pow(ECONOMY.generatorCostGrowth, state.generators[g.id] || 0);
      return Math.min(min, cost);
    }, Infinity);
    const upgradeMin = Object.values(UPGRADE_GROUPS)
      .flat()
      .reduce((min, u) => {
        const lvl = state.upgradeLevels[u.id] || 0;
        return Math.min(min, u.baseCost * Math.pow(2, lvl));
      }, Infinity);
    return Math.min(generatorMin, upgradeMin);
  }, [state.generators, state.upgradeLevels]);

  const activeMultipliers = useMemo(() => {
    const now = Date.now();
    const mul = { click: 1, production: 1 };
    ABILITIES.forEach((a) => {
      if (state.abilityState[a.id]?.endsAt > now) {
        if (a.effect.click) mul.click *= a.effect.click;
        if (a.effect.production) mul.production *= a.effect.production;
      }
    });
    if (state.randomEvent?.type === 'meteor' && state.randomEventEndsAt > now) mul.production *= 2;
    return mul;
  }, [state.abilityState, state.randomEvent, state.randomEventEndsAt]);

  const cps = applyMulti(generatorCps, [
    state.productionMultiplier,
    skillEffects.production,
    skillEffects.all,
    activeMultipliers.production,
    state.achievementBoost.production,
    state.achievementBoost.all,
    1 + state.prestigeLevel * 0.08,
  ]);

  const clickValueBase = applyMulti(state.clickPower, [
    state.clickMultiplier,
    skillEffects.click,
    skillEffects.all,
    activeMultipliers.click,
    state.achievementBoost.click,
    state.achievementBoost.all,
    1 + state.prestigeLevel * 0.1,
  ]);

  const addCurrency = (amount) => {
    setState((prev) => ({
      ...prev,
      currency: prev.currency + amount,
      lifetimeCurrency: prev.lifetimeCurrency + amount,
    }));
  };

  const clickCore = () => {
    const critChance = Math.min(0.8, state.critChance + skillEffects.crit);
    const isCrit = Math.random() < critChance;
    const eventBonus = state.randomEvent?.type === 'golden' && state.randomEventEndsAt > Date.now() ? 4 : 1;
    const amount = clickValueBase * eventBonus * (isCrit ? state.critMultiplier : 1);
    addCurrency(amount);
    setState((prev) => ({ ...prev, totalClicks: prev.totalClicks + 1 }));
    const id = crypto.randomUUID();
    setFloaters((prev) => [...prev, { id, amount, crit: isCrit }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 850);

    if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = isCrit ? 540 : 360;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const buyGenerator = (id) => {
    const g = GENERATORS.find((x) => x.id === id);
    const owned = state.generators[id] || 0;
    const cost = g.baseCost * Math.pow(ECONOMY.generatorCostGrowth, owned);
    if (state.currency < cost) return;
    setState((prev) => ({
      ...prev,
      currency: prev.currency - cost,
      generators: { ...prev.generators, [id]: owned + 1 },
      totalGenerators: prev.totalGenerators + 1,
    }));
  };

  const buyUpgrade = (upgrade, group) => {
    const level = state.upgradeLevels[upgrade.id] || 0;
    const cost = upgrade.baseCost * Math.pow(2, level);
    if (state.currency < cost) return;
    setState((prev) => {
      const next = { ...prev, currency: prev.currency - cost, upgradeLevels: { ...prev.upgradeLevels, [upgrade.id]: level + 1 } };
      if (group === 'click') next.clickMultiplier *= upgrade.value;
      if (group === 'production') next.productionMultiplier *= upgrade.value;
      if (group === 'crit') next.critChance += upgrade.value;
      return next;
    });
  };

  const activateAbility = (id) => {
    const ability = ABILITIES.find((a) => a.id === id);
    const now = Date.now();
    const status = state.abilityState[id];
    if (!status || status.readyAt > now) return;
    setState((prev) => ({
      ...prev,
      abilityState: {
        ...prev.abilityState,
        [id]: { readyAt: now + ability.cooldownMs, endsAt: now + ability.durationMs },
      },
    }));
  };

  const unlockSkill = (node) => {
    if (state.skillNodes.includes(node.id)) return;
    if (node.requires.some((req) => !state.skillNodes.includes(req))) return;
    const available = state.prestigePoints - state.spentPrestige;
    if (available < node.cost) return;
    setState((prev) => ({ ...prev, skillNodes: [...prev.skillNodes, node.id], spentPrestige: prev.spentPrestige + node.cost }));
  };

  const prestige = () => {
    const gain = Math.floor(Math.pow(state.lifetimeCurrency / 50000, ECONOMY.prestigeExponent));
    if (gain < 1) return;
    setState((prev) => ({
      ...createBaseState(),
      prestigeLevel: prev.prestigeLevel + 1,
      prestigePoints: prev.prestigePoints + gain,
      skillNodes: prev.skillNodes,
      spentPrestige: prev.spentPrestige,
      daily: prev.daily,
      theme: prev.theme,
      themeMeta: THEMES[prev.theme],
      lastTick: Date.now(),
      lastSave: Date.now(),
    }));
  };

  const claimDaily = () => {
    const today = dayStamp();
    if (state.daily.lastClaimDay === today) return;
    const streak = state.daily.lastClaimDay === today - 1 ? state.daily.streak + 1 : 1;
    const bonus = 80 * streak;
    setState((prev) => ({
      ...prev,
      currency: prev.currency + bonus,
      lifetimeCurrency: prev.lifetimeCurrency + bonus,
      daily: { streak, lastClaimDay: today },
    }));
  };

  const setTheme = (theme) => setState((prev) => ({ ...prev, theme, themeMeta: THEMES[theme] }));

  useEffect(() => {
    const now = Date.now();
    const deltaS = Math.min(8 * 3600, Math.max(0, (now - (state.lastTick || now)) / 1000));
    if (deltaS > 1) {
      const offlineGain = cps * deltaS * skillEffects.offline;
      setState((prev) => ({ ...prev, currency: prev.currency + offlineGain, lifetimeCurrency: prev.lifetimeCurrency + offlineGain }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      setState((prev) => {
        let gain = cps / 10;
        let randomEvent = prev.randomEvent;
        let randomEventEndsAt = prev.randomEventEndsAt;

        if (!randomEvent || randomEventEndsAt <= now) {
          if (Math.random() < 0.08) {
            randomEvent = Math.random() > 0.5 ? { type: 'golden', label: 'Golden Click Window!' } : { type: 'meteor', label: 'Meteor Shower!' };
            randomEventEndsAt = now + 10000;
          } else {
            randomEvent = null;
          }
        }

        const shouldRecover = prev.currency < minUpgradeCost * 0.25;
        if (shouldRecover && now - prev.recoveryMeter > ECONOMY.recoveryTickMs) {
          gain += Math.max(2, minUpgradeCost * ECONOMY.recoveryBonus);
        }

        return {
          ...prev,
          currency: prev.currency + gain,
          lifetimeCurrency: prev.lifetimeCurrency + gain,
          randomEvent,
          randomEventEndsAt,
          lastTick: now,
          recoveryMeter: shouldRecover ? now : prev.recoveryMeter,
        };
      });
    }, 100);

    return () => clearInterval(tick);
  }, [cps, minUpgradeCost]);

  useEffect(() => {
    const achieve = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.check(state));
    if (achieve.length === 0) return;
    setState((prev) => {
      const next = { ...prev, achievements: [...prev.achievements], achievementBoost: { ...prev.achievementBoost } };
      achieve.forEach((a) => {
        next.achievements.push(a.id);
        if (a.reward.flat) {
          next.currency += a.reward.flat;
          next.lifetimeCurrency += a.reward.flat;
        }
        if (a.reward.click) next.achievementBoost.click *= a.reward.click;
        if (a.reward.production) next.achievementBoost.production *= a.reward.production;
        if (a.reward.all) next.achievementBoost.all *= a.reward.all;
      });
      return next;
    });
  }, [state]);

  useEffect(() => {
    const saver = setInterval(() => progressRepository.save({ ...state, lastSave: Date.now(), lastTick: Date.now() }), 2000);
    return () => clearInterval(saver);
  }, [state]);

  return {
    state,
    floaters,
    cps,
    clickValueBase,
    clickCore,
    buyGenerator,
    buyUpgrade,
    activateAbility,
    unlockSkill,
    prestige,
    claimDaily,
    setTheme,
  };
};
