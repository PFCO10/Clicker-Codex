import { useMemo, useState } from 'react';
import { ABILITIES, ACHIEVEMENTS, format, GENERATORS, SKILL_TREE, THEMES, UPGRADE_GROUPS } from './game/balance';
import { useGameEngine } from './game/useGameEngine';

const tiers = [0, 5000, 80000, 600000, 5000000];

function App() {
  const {
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
  } = useGameEngine();
  const [shake, setShake] = useState(false);

  const activeTheme = THEMES[state.theme] || THEMES.aiFactory;
  const tier = useMemo(() => tiers.filter((t) => state.lifetimeCurrency >= t).length - 1, [state.lifetimeCurrency]);
  const canPrestige = Math.floor(Math.pow(state.lifetimeCurrency / 50000, 0.42)) >= 1;
  const availablePrestige = state.prestigePoints - state.spentPrestige;

  const onClick = () => {
    clickCore();
    setShake(true);
    setTimeout(() => setShake(false), 120);
  };

  return (
    <div className={`app tier-${tier}`} style={{ '--accent': activeTheme.accent }}>
      <div className="parallax"></div>
      <header className="topbar glass">
        <div>
          <h1>Neon Idle Forge</h1>
          <p>Theme: {activeTheme.name}</p>
        </div>
        <div className="stats-row">
          <span>⚡ {format(state.currency)} Flux</span>
          <span>⏱ {format(cps)}/s</span>
          <span>🖱 {format(clickValueBase)}/click</span>
        </div>
      </header>

      <main className="grid">
        <section className="core-panel glass">
          <div className={`core ${shake ? 'shake' : ''}`} onClick={onClick} role="button" tabIndex={0}>
            <div className="core-inner">{activeTheme.object}</div>
            {floaters.map((f) => (
              <div key={f.id} className={`floater ${f.crit ? 'crit' : ''}`}>
                +{format(f.amount)}
              </div>
            ))}
          </div>
          <div className="buttons-row">
            <button onClick={claimDaily}>Daily Reward (streak {state.daily.streak})</button>
            <button onClick={prestige} disabled={!canPrestige}>
              Rebirth (+{Math.floor(Math.pow(state.lifetimeCurrency / 50000, 0.42))} cores)
            </button>
          </div>
          {state.randomEvent && <div className="event-banner">{state.randomEvent.label}</div>}
          <div className="theme-pills">
            {Object.entries(THEMES).map(([id, theme]) => (
              <button key={id} className={id === state.theme ? 'active' : ''} onClick={() => setTheme(id)}>
                {theme.name}
              </button>
            ))}
          </div>
        </section>

        <section className="panel glass">
          <h2>Generators</h2>
          {GENERATORS.map((g) => {
            const owned = state.generators[g.id] || 0;
            const cost = g.baseCost * Math.pow(1.16, owned);
            return (
              <button key={g.id} className="list-item" onClick={() => buyGenerator(g.id)}>
                <div>
                  <strong>{g.name}</strong>
                  <small>{owned} owned · {format(g.baseCps)} base/s</small>
                </div>
                <span>{format(cost)}</span>
              </button>
            );
          })}

          <h2>Abilities</h2>
          {ABILITIES.map((a) => {
            const readyAt = state.abilityState?.[a.id]?.readyAt || 0;
            const readyIn = Math.max(0, readyAt - Date.now());
            return (
              <button key={a.id} className="list-item" onClick={() => activateAbility(a.id)} disabled={readyIn > 0} title={a.desc}>
                <div>
                  <strong>{a.name}</strong>
                  <small>{a.desc}</small>
                </div>
                <span>{readyIn > 0 ? `${Math.ceil(readyIn / 1000)}s` : 'Ready'}</span>
              </button>
            );
          })}
        </section>

        <section className="panel glass">
          <h2>Upgrades</h2>
          {Object.entries(UPGRADE_GROUPS).map(([group, list]) => (
            <div key={group}>
              <h3>{group}</h3>
              {list.map((u) => {
                const lvl = state.upgradeLevels[u.id] || 0;
                const cost = u.baseCost * Math.pow(2, lvl);
                return (
                  <button key={u.id} className="list-item" onClick={() => buyUpgrade(u, group)}>
                    <div>
                      <strong>{u.name}</strong>
                      <small>Lv {lvl}</small>
                    </div>
                    <span>{format(cost)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </section>

        <section className="panel glass">
          <h2>Skill Tree ({availablePrestige} points)</h2>
          {SKILL_TREE.map((node) => {
            const unlocked = state.skillNodes.includes(node.id);
            const canUnlock = !unlocked && node.requires.every((r) => state.skillNodes.includes(r));
            return (
              <button key={node.id} className={`list-item ${unlocked ? 'active' : ''}`} onClick={() => unlockSkill(node)} disabled={!canUnlock}>
                <div>
                  <strong>{node.name}</strong>
                  <small>{node.desc}</small>
                </div>
                <span>{unlocked ? 'Unlocked' : `${node.cost} pt`}</span>
              </button>
            );
          })}

          <h2>Achievements</h2>
          <div className="achievement-grid">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className={`achievement ${state.achievements.includes(a.id) ? 'done' : ''}`}>
                {a.title}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
