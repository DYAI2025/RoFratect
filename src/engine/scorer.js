const normalizePattern = s => s.replace(/\(\?i\)/gi, "");
const re = s => new RegExp(normalizePattern(s), "i");

export class ScoringEngine {
  constructor({registry, markers}) {
    this.registry = registry;
    this.markers = markers.map(m => ({...m, _regex: (m.patterns||[]).map(re)}));
    this.state = { hits: [], perMarkerCount: {}, perClassHits: {} };
  }

  slideWindow(messages, m) {
    const win = m.window?.messages ?? 10;
    return messages.slice(-win);
  }

  evalMarker(messages, m) {
    // collect or regex match
    if (m.collect) {
      const rx = new RegExp(m.collect.regex, "i");
      const vals = new Set();
      for (const msg of messages) {
        const t = msg.text;
        const mobj = t.match(rx);
        if (mobj && mobj[m.collect.field]) vals.add(mobj[m.collect.field]);
      }
      return vals.size >= (m.collect.min_distinct || 2);
    }
    // patterns ANY
    return this.slideWindow(messages, m).some(msg => {
      const t = msg.text;
      return m._regex?.some(rx => rx.test(t));
    });
  }

  score(messages) {
    this.state = { hits: [], perMarkerCount: {}, perClassHits: {} };
    let raw = 0;

    for (const m of this.markers) {
      const active = this.evalMarker(messages, m);
      if (!active) continue;

      // activation rule gate
      const k = m.id;
      this.state.perMarkerCount[k] = (this.state.perMarkerCount[k] || 0) + 1;

      const clsW = this.registry.class_weights[m.category] || 1.0;
      const w = (m.weight || 1.0) * clsW;
      raw += w;
      this.state.hits.push(k);
      this.state.perClassHits[m.category] = (this.state.perClassHits[m.category] || 0) + 1;
    }

    // synergies
    let mult = 1.0;
    for (const b of this.registry.boost_when || []) {
      if (b.any_of.some(id => this.state.hits.includes(id))) mult *= (b.multiplier || 1.0);
    }

    const S = raw * mult;

    // killer combos
    const killer = (this.registry.killer_combos || []).some(combo => combo.every(id => this.state.hits.includes(id)));

    return { S, killer, hits: this.state.hits, mult, raw };
  }
}

