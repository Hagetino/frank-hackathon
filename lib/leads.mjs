// Demo dataset: fictional UK brokers shaped like FCA Register records.
// Production swaps this file for the FCA Register API + enrichment.

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

const R = rng(20261116);
const pick = (a) => a[Math.floor(R() * a.length)];
const between = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));

const TOWNS = [
  ["Leeds", "Yorkshire"], ["Harrogate", "Yorkshire"], ["York", "Yorkshire"], ["Sheffield", "Yorkshire"],
  ["Manchester", "North West"], ["Chester", "North West"], ["Preston", "North West"], ["Lancaster", "North West"],
  ["Bristol", "South West"], ["Exeter", "South West"], ["Truro", "South West"], ["Cheltenham", "South West"],
  ["Norwich", "East of England"], ["Ipswich", "East of England"], ["Cambridge", "East of England"],
  ["Reading", "South East"], ["Guildford", "South East"], ["Maidstone", "South East"], ["Brighton", "South East"],
  ["Birmingham", "Midlands"], ["Nottingham", "Midlands"], ["Leicester", "Midlands"], ["Shrewsbury", "Midlands"],
  ["London", "London"], ["Croydon", "London"], ["Newcastle", "North East"], ["Durham", "North East"],
  ["Cardiff", "Wales"], ["Swansea", "Wales"], ["Edinburgh", "Scotland"], ["Glasgow", "Scotland"], ["Aberdeen", "Scotland"],
];
const STEMS = [
  "Thornbury", "Ashcombe", "Kestrel", "Fairholme", "Brookfield", "Marlow", "Calder", "Hartwell", "Penrose",
  "Whitlock", "Oakridge", "Langley", "Redwater", "Ellison", "Moorgate", "Saxonby", "Holloway", "Fernley",
  "Greystone", "Ambleside", "Wickham", "Harcourt", "Pemberton", "Larkfield", "Cotswold", "Blackwood",
  "Selby", "Rowan", "Kingsmere", "Dunmore", "Albion", "Westbury", "Northgate", "Lowther", "Tamar", "Severn",
  "Ridgeway", "Hadley", "Beaumont", "Carrick", "Elmhurst", "Fenwick", "Garside", "Ingram", "Kirkby",
  "Linton", "Mercer", "Norland", "Ormsby", "Prescott", "Radley", "Stanway", "Talbot", "Underwood", "Vance",
  "Wetherby", "Yardley", "Ashdown", "Bramley", "Colville",
];
const FIRST = ["James", "Sarah", "David", "Emma", "Mark", "Claire", "Paul", "Rachel", "Andrew", "Helen", "Simon",
  "Laura", "Richard", "Joanne", "Tom", "Kate", "Gareth", "Fiona", "Neil", "Amy", "Stuart", "Hannah", "Ian", "Louise"];
const LAST = ["Clarke", "Walsh", "Hughes", "Turner", "Bennett", "Patel", "Morgan", "Doyle", "Fraser", "Kaur",
  "Lloyd", "Reid", "Shaw", "Barker", "Holmes", "Price", "Ahmed", "Murray", "Webb", "Cole", "Ward", "Ellis"];

// Archetypes the market actually has; clustering has to rediscover them from the features.
const ARCHETYPES = [
  {
    key: "personal", weight: 0.32,
    suffix: ["Insurance Services", "Insurance Brokers", "Insurance"],
    staff: [2, 9], branches: [1, 1], commercial: [0.05, 0.3], specialist: [0, 0.15],
    carriers: [8, 18], policies: [600, 2500], digital: [0.1, 0.5], legal: ["Ltd", "Ltd", "Sole trader", "Partnership"],
    lines: ["Motor", "Home", "Landlord", "Travel", "Pet"],
  },
  {
    key: "commercial", weight: 0.3,
    suffix: ["Commercial Insurance", "Risk Solutions", "Insurance Brokers"],
    staff: [8, 40], branches: [1, 3], commercial: [0.6, 0.95], specialist: [0.05, 0.3],
    carriers: [15, 35], policies: [1200, 6000], digital: [0.3, 0.75], legal: ["Ltd"],
    lines: ["Commercial combined", "Fleet", "Liability", "Property owners", "Tradesman", "Professional indemnity"],
  },
  {
    key: "specialist", weight: 0.2,
    suffix: ["Underwriting", "Specialist Insurance", "Insurance Brokers"],
    staff: [4, 18], branches: [1, 2], commercial: [0.4, 0.8], specialist: [0.65, 1],
    carriers: [5, 14], policies: [400, 2000], digital: [0.2, 0.6], legal: ["Ltd"],
    lines: ["Equine", "Marine & yacht", "Classic car", "Agricultural", "Event", "Thatched property", "Hospitality"],
  },
  {
    key: "network", weight: 0.18,
    suffix: ["Insurance Group", "Broking Group", "Insurance Partners"],
    staff: [35, 160], branches: [3, 14], commercial: [0.4, 0.75], specialist: [0.1, 0.35],
    carriers: [25, 60], policies: [5000, 30000], digital: [0.5, 0.95], legal: ["Ltd", "PLC"],
    lines: ["Commercial combined", "Motor", "Home", "Fleet", "Liability", "Employee benefits"],
  },
];

const SOFTWARE = ["Acturis", "Acturis", "OpenGI", "OpenGI", "SSP", "Applied Epic", "Spreadsheets + carrier portals"];
const SIGNALS = [
  "Hiring: Account Handler (admin-heavy role)",
  "Hiring: Insurance Administrator",
  "Exhibited at BIBA Conference 2026",
  "New website launched in the last 90 days",
  "Opened a new branch this year",
  "Director posted about renewal workload on LinkedIn",
  "Moving off a legacy broker system",
  "Recently joined a broker network",
];

function rangeF([lo, hi]) { return +(lo + R() * (hi - lo)).toFixed(2); }

function archetype() {
  let x = R();
  for (const a of ARCHETYPES) { if ((x -= a.weight) <= 0) return a; }
  return ARCHETYPES[0];
}

const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");

export function generateLeads(n = 56) {
  n = Math.min(n, STEMS.length); // one firm per name stem
  const used = new Set();
  const leads = [];
  for (let i = 0; i < n; i++) {
    const a = archetype();
    let stem;
    do { stem = pick(STEMS); } while (used.has(stem));
    used.add(stem);
    const firm = `${stem} ${pick(a.suffix)}`;
    const [town, region] = pick(TOWNS);
    const staff = between(...a.staff);
    const legal = pick(a.legal);
    const first = pick(FIRST), last = pick(LAST);
    const signalCount = R() < 0.55 ? between(1, 2) : 0;
    const signals = [];
    while (signals.length < signalCount) {
      const s = pick(SIGNALS);
      if (!signals.includes(s)) signals.push(s);
    }
    const lines = [...a.lines].sort(() => R() - 0.5).slice(0, between(2, 4));
    leads.push({
      id: `L${String(i + 1).padStart(3, "0")}`,
      firm: legal === "Ltd" || legal === "PLC" ? `${firm} ${legal}` : firm,
      frn: String(between(300000, 999999)),
      legalForm: legal,
      town, region,
      contact: { name: `${first} ${last}`, role: staff > 30 ? pick(["Operations Director", "Managing Director", "Head of Broking"]) : pick(["Director", "Managing Director", "Principal"]) },
      email: `${first.toLowerCase()}@${slug(stem)}-insurance.example`,
      phone: `+44 ${between(1100, 1999)} ${between(100000, 999999)}`,
      linkedin: `linkedin.com/in/${slug(first)}-${slug(last)}-${between(10, 99)}`,
      staff,
      branches: between(...a.branches),
      commercialShare: rangeF(a.commercial),
      specialistShare: rangeF(a.specialist),
      digitalMaturity: rangeF(a.digital),
      carriers: between(...a.carriers),
      policies: between(...a.policies),
      software: pick(SOFTWARE),
      lines,
      signals,
      ctps: R() < 0.17,
      founded: between(1978, 2021),
      _archetype: a.key,
    });
  }
  return leads;
}

// The generator's shuffle depends on the engine's sort, so serve the frozen copy.
import FROZEN from "./leads-data.mjs";
export function buildLeads() {
  return structuredClone(FROZEN);
}
