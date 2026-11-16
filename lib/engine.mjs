// Clustering (k-means on firm features), ranking, compliance gating and sequence planning.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const features = (l) => [
  Math.min(1, Math.log(l.staff) / Math.log(160)),
  l.commercialShare,
  l.specialistShare,
  l.digitalMaturity,
];

const dist2 = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

function kmeans(points, k, seed = 7) {
  const R = rng(seed);
  // k-means++ initialisation
  const centroids = [points[Math.floor(R() * points.length)]];
  while (centroids.length < k) {
    const d = points.map((p) => Math.min(...centroids.map((c) => dist2(p, c))));
    let x = R() * d.reduce((a, b) => a + b, 0);
    let idx = 0;
    while ((x -= d[idx]) > 0) idx++;
    centroids.push(points[idx]);
  }
  let assign = new Array(points.length).fill(0);
  for (let iter = 0; iter < 60; iter++) {
    const next = points.map((p) => {
      let best = 0;
      centroids.forEach((c, j) => { if (dist2(p, c) < dist2(p, centroids[best])) best = j; });
      return best;
    });
    const moved = next.some((v, i) => v !== assign[i]);
    assign = next;
    for (let j = 0; j < k; j++) {
      const members = points.filter((_, i) => assign[i] === j);
      if (members.length) centroids[j] = members[0].map((_, f) => members.reduce((s, m) => s + m[f], 0) / members.length);
    }
    if (!moved && iter > 0) break;
  }
  return { assign, centroids };
}

const CLUSTER_META = {
  network: {
    name: "Multi-branch groups & networks",
    play: "One deal unlocks many offices. Lead with Enterprise ROI and a pilot in one branch.",
    motion: "Human-assisted close (exec intro), AI does everything before it",
    color: "#8b7bff",
  },
  commercial: {
    name: "Commercial SME brokers",
    play: "Renewal season pain: multi-carrier quoting for property, fleet and liability.",
    motion: "Zero-human: AI outreach → AI call → self-serve trial",
    color: "#4c8dff",
  },
  specialist: {
    name: "Specialist & niche brokers",
    play: "Few carriers, bespoke portals. Sell document analysis and policy comparison.",
    motion: "Zero-human: AI outreach → live demo on their own policy",
    color: "#2cc4b8",
  },
  personal: {
    name: "Personal-lines independents",
    play: "Tiny teams buried in motor/home quotes. €39 trial, value in week one.",
    motion: "Zero-human, fully self-serve",
    color: "#ff7a45",
  },
};

function labelClusters(centroids) {
  // centroid = [size, commercial, specialist, digital]
  const left = new Set(centroids.map((_, i) => i));
  const take = (fn) => {
    const best = [...left].sort((a, b) => fn(centroids[b]) - fn(centroids[a]))[0];
    left.delete(best);
    return best;
  };
  const labels = {};
  labels[take((c) => c[2])] = "specialist";
  labels[take((c) => c[0])] = "network";
  labels[take((c) => c[1])] = "commercial";
  labels[[...left][0]] = "personal";
  return labels;
}

// FRANK runs robots in Portuguese portals and five PT broker ERPs today; UK connectors are build priorities.
const INTEGRATION = {
  "Acturis": { pts: 18, note: "Largest UK broker platform: connector priority #1" },
  "OpenGI": { pts: 18, note: "Large SME install base: connector priority #2" },
  "SSP": { pts: 12, note: "CSV bridge first, connector later" },
  "Applied Epic": { pts: 8, note: "Not planned yet: Operator works on insurer portals only" },
  "Spreadsheets + carrier portals": { pts: 20, note: "No ERP to integrate: Operator works straight on insurer portals" },
};

// FRANK's two client profiles (brief, Aug 2026): independents ~1-5 k€/yr, large brokers ~5-20 k€ today, up to ~80 k€.
function dealValue(l) {
  if (l.staff > 30 || l.branches >= 3) {
    return { profile: "Large broker / network", eur: Math.min(20000, 5000 + l.staff * 100), potentialEur: Math.min(80000, l.staff * 600) };
  }
  const eur = Math.min(5000, 1000 + l.staff * 250);
  return { profile: "Independent agency", eur, potentialEur: eur };
}

// ~10 h of admin freed per mediator per week (agencies' own reports, per the brief).
const hoursFreed = (l) => Math.round(Math.max(1, l.staff * 0.7) * 10);

export function score(l) {
  const parts = [];
  const sizePts = l.staff <= 2 ? 8 : l.staff <= 40 ? 20 : l.staff <= 80 ? 14 : 10;
  parts.push({ k: "Size fit", pts: sizePts, max: 20, why: `${l.staff} staff, ${l.branches} branch${l.branches > 1 ? "es" : ""}` });

  const perHead = l.policies / l.staff;
  const pain = Math.min(1, perHead / 250) * 0.6 + Math.min(1, l.carriers / 30) * 0.4;
  parts.push({ k: "Admin workload", pts: Math.round(pain * 25), max: 25, why: `~${Math.round(perHead)} policies per head across ${l.carriers} carriers` });

  const integ = INTEGRATION[l.software];
  parts.push({ k: "Integration ready", pts: integ.pts, max: 20, why: `${l.software}: ${integ.note}` });

  parts.push({ k: "Buying signals", pts: Math.min(20, l.signals.length * 10), max: 20, why: l.signals.length ? l.signals.join("; ") : "None detected" });

  parts.push({ k: "Digital maturity", pts: Math.round(l.digitalMaturity * 10), max: 10, why: `${Math.round(l.digitalMaturity * 100)}/100 from website + tooling` });

  const c = compliance(l);
  const reach = (c.email.ok ? 3 : 0) + (c.call.ok ? 2 : 0);
  parts.push({ k: "Reachability", pts: reach, max: 5, why: [c.email.ok ? "email OK" : "no cold email", c.call.ok ? "callable" : "CTPS: no calls"].join(", ") });

  const total = parts.reduce((s, p) => s + p.pts, 0);
  const tier = total >= 70 ? "A" : total >= 55 ? "B" : "C";
  return { total, tier, parts, deal: dealValue(l), hoursFreedPerWeek: hoursFreed(l) };
}

export function compliance(l) {
  const corporate = l.legalForm === "Ltd" || l.legalForm === "PLC";
  return {
    email: corporate
      ? { ok: true, rule: "PECR: corporate subscriber, B2B email allowed with clear opt-out" }
      : { ok: false, rule: `PECR: ${l.legalForm.toLowerCase()} counts as an individual subscriber, cold email needs prior consent` },
    linkedin: { ok: true, rule: "Connection request + note, within LinkedIn limits" },
    call: l.ctps
      ? { ok: false, rule: "Number is on the CTPS register: no unsolicited calls" }
      : { ok: true, rule: "CTPS clear. AI calls only after the broker opts in (PECR reg. 19: automated calls need prior consent); AI disclosed in the first sentence" },
    whatsapp: { ok: false, rule: "Only after the broker opts in (reply or form)" },
  };
}

export function sequence(l) {
  const c = compliance(l);
  const steps = [];
  if (c.email.ok) steps.push({ day: 0, channel: "email", label: "Personalised email" });
  steps.push({ day: c.email.ok ? 2 : 0, channel: "linkedin", label: "LinkedIn connection note" });
  if (c.call.ok) steps.push({ day: 4, channel: "call", label: "AI voice call (only if they click 'call me')" });
  if (c.email.ok) steps.push({ day: 7, channel: "email", label: "Follow-up with 2-min demo video" });
  steps.push({ day: 9, channel: "whatsapp", label: "WhatsApp follow-up (only after opt-in)" });
  return steps;
}

export function analyse(leads) {
  const { assign, centroids } = kmeans(leads.map(features), 4);
  const labels = labelClusters(centroids);
  const enriched = leads.map((l, i) => {
    const { _archetype, ...rest } = l;
    return { ...rest, cluster: labels[assign[i]], score: score(l), compliance: compliance(l), sequence: sequence(l) };
  });
  enriched.sort((a, b) => b.score.total - a.score.total);
  enriched.forEach((l, i) => (l.rank = i + 1));
  const clusters = Object.entries(CLUSTER_META).map(([key, meta]) => {
    const members = enriched.filter((l) => l.cluster === key);
    const avg = members.length ? Math.round(members.reduce((s, l) => s + l.score.total, 0) / members.length) : 0;
    return {
      key, ...meta,
      count: members.length,
      avgScore: avg,
      tierA: members.filter((l) => l.score.tier === "A").length,
      pipelineEur: members.reduce((s, l) => s + l.score.deal.eur, 0),
    };
  }).sort((a, b) => b.avgScore - a.avgScore);
  return { leads: enriched, clusters };
}
