/**
 * Procedural village footprint. Default ~1000 homes.
 * `?homes=N` or `window.WL_SIZE` override. Core 24 stay named anchors.
 */

export const PEOPLE_PER_HOME = 5;

function sizeFromPage() {
  const cfg = typeof window !== "undefined" ? window.WL_SIZE : null;
  const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
  const people = Number(cfg?.people ?? q.get("people"));
  if (Number.isFinite(people) && people > 0) {
    return { people, homes: Math.max(8, Math.round(people / PEOPLE_PER_HOME)) };
  }
  const homes = Number(cfg?.homes ?? q.get("homes"));
  if (Number.isFinite(homes) && homes > 0) {
    const n = Math.max(8, Math.round(homes));
    return { people: n * PEOPLE_PER_HOME, homes: n };
  }
  return { people: 1000 * PEOPLE_PER_HOME, homes: 1000 };
}

const VILLAGE_SIZE = sizeFromPage();
export const TARGET_HOMES = VILLAGE_SIZE.homes;
export const VILLAGE_PEOPLE = VILLAGE_SIZE.people;

const PROFILES = [
  { nightW: 25, dayW: 70, eveW: 130, loadLimitW: 220, nightLoad: "lighting", dayLoad: "fridge", eveLoad: "lighting" },
  { nightW: 20, dayW: 90, eveW: 200, loadLimitW: 280, nightLoad: "lighting", dayLoad: "pump", eveLoad: "cooking" },
  { nightW: 40, dayW: 80, eveW: 100, loadLimitW: 160, nightLoad: "fridge", dayLoad: "fridge", eveLoad: "fridge" },
  { nightW: 22, dayW: 85, eveW: 170, loadLimitW: 240, nightLoad: "lighting", dayLoad: "lighting", eveLoad: "cooking" },
];

const CORE_NAMES = [
  "Amina", "Joseph", "Grace", "Peter", "Sarah", "David",
  "Kwame", "Fatima", "Ibrahim", "Chika", "Omar", "Lila",
  "Yusuf", "Nia", "Bongani", "Asha", "Tariq", "Mariam",
  "Kofi", "Zara", "Samuel", "Hana", "Idris", "Palesa",
];

const GIVEN = [
  "Leila", "Musa", "Hope", "Daniel", "Ayo", "Ruth", "Eshe", "Tomas", "Winta", "Juma",
  "Sanaa", "Abel", "Farah", "Kojo", "Dina", "Issa", "Makeda", "Ravi", "Noor", "Taye",
  "Sifiso", "Halima", "Yara", "Biko", "Lina", "Oumar", "Zuri", "Ama", "Sami", "Thea",
  "Ife", "Nuru", "Gita", "Pio", "Selam", "Ada", "Ben", "Cora", "Eli", "Femi",
];

export const CLUSTERS = [
  { id: "west", label: "west farms", x: -48, z: 22, r: 16 },
  { id: "market", label: "market", x: -5, z: 3, r: 9 },
  { id: "clinic", label: "clinic", x: 16, z: -1, r: 6 },
  { id: "south", label: "south", x: 10, z: 52, r: 14 },
  { id: "east", label: "east", x: 40, z: 12, r: 11 },
];

const CORE_SITES = [
  [-5.0, 2.4, "market"],
  [-3.2, 3.2, "market"],
  [-5.6, 4.0, "market"],
  [-23.5, 5.2, "west"],
  [-4.0, 4.6, "market"],
  [11.2, 0.8, "clinic"],
  [-24.8, 6.4, "west"],
  [-1.2, 2.2, "market"],
  [-21.6, 7.5, "west"],
  [0.5, 12.0, "south"],
  [9.4, 1.2, "clinic"],
  [-6.2, 2.8, "market"],
  [-13.4, 4.2, "west"],
  [10.8, -1.4, "clinic"],
  [5.2, 21.2, "south"],
  [8.8, -1.0, "clinic"],
  [21.2, 3.4, "east"],
  [3.8, 21.8, "south"],
  [-22.2, 4.8, "west"],
  [6.4, 21.8, "south"],
  [22.8, 2.6, "east"],
  [2.8, 22.4, "south"],
  [23.2, 5.0, "east"],
  [21.0, 5.4, "east"],
];

function mulberry(seed) {
  let x = seed | 0;
  return () => {
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    x = x ^ (x >>> 16);
    return (x >>> 0) / 4294967296;
  };
}

function gauss(rand) {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function nearestClusterId(x, z) {
  let best = CLUSTERS[0].id;
  let bd = Infinity;
  for (const c of CLUSTERS) {
    const d = (c.x - x) ** 2 + (c.z - z) ** 2;
    if (d < bd) {
      bd = d;
      best = c.id;
    }
  }
  return best;
}

function tryAdd(sites, x, z, minD, cluster) {
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i];
    if ((s[0] - x) ** 2 + (s[1] - z) ** 2 < minD * minD) return false;
  }
  sites.push([x, z, cluster || nearestClusterId(x, z)]);
  return true;
}

function blob(sites, cx, cz, n, sig, minD, rand, cluster) {
  let added = 0;
  let guard = 0;
  while (added < n && guard++ < n * 24) {
    const ang = rand() * Math.PI * 2;
    const r = Math.abs(gauss(rand)) * sig;
    const x = cx + Math.cos(ang) * r;
    const z = cz + Math.sin(ang) * r;
    if (tryAdd(sites, x, z, minD, cluster)) added += 1;
  }
}

function along(sites, pts, n, jitter, minD, rand) {
  if (pts.length < 2 || n <= 0) return;
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(d);
    total += d;
  }
  for (let k = 0; k < n; k++) {
    const t = ((k + 0.37 + rand() * 0.5) / n) * total;
    let acc = 0;
    let i = 0;
    while (i < seg.length - 1 && acc + seg[i] < t) {
      acc += seg[i];
      i += 1;
    }
    const u = (t - acc) / (seg[i] || 1);
    const ax = pts[i][0];
    const az = pts[i][1];
    const bx = pts[i + 1][0];
    const bz = pts[i + 1][1];
    const px = ax + (bx - ax) * u;
    const pz = az + (bz - az) * u;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const off = (rand() - 0.5) * 2 * jitter;
    tryAdd(sites, px + (-dz / len) * off, pz + (dx / len) * off, minD, null);
  }
}

function pickCoreSites(n) {
  if (n >= CORE_SITES.length) return CORE_SITES.map((s) => s.slice());
  const order = ["market", "west", "south", "clinic", "east"];
  const want = Object.fromEntries(order.map((c) => [c, 0]));
  for (let i = 0; i < n; i++) want[order[i % order.length]] += 1;
  const out = [];
  const used = new Set();
  for (const cl of order) {
    let need = want[cl];
    for (let i = 0; i < CORE_SITES.length && need > 0; i++) {
      if (CORE_SITES[i][2] !== cl || used.has(i)) continue;
      out.push(CORE_SITES[i].slice());
      used.add(i);
      need -= 1;
    }
  }
  for (let i = 0; i < CORE_SITES.length && out.length < n; i++) {
    if (used.has(i)) continue;
    out.push(CORE_SITES[i].slice());
    used.add(i);
  }
  return out;
}

function buildSites() {
  const rand = mulberry(20260813);
  const target = TARGET_HOMES;
  if (target <= CORE_SITES.length) {
    return pickCoreSites(target);
  }
  const sites = CORE_SITES.map((s) => s.slice());
  if (target < 400) {
    const extra = target - sites.length;
    const plan = [
      [-5, 3, 0.28, 5.5, 1.2, "market"],
      [16, -1, 0.1, 4.0, 1.15, "clinic"],
      [40, 11, 0.16, 6.0, 1.2, "east"],
      [-50, 20, 0.18, 11, 1.6, "west"],
      [9, 54, 0.16, 10, 1.5, "south"],
      [8, 18, 0.12, 8, 1.35, "south"],
    ];
    for (const [cx, cz, frac, sig, minD, cl] of plan) {
      const left = target - sites.length;
      if (left <= 0) break;
      blob(sites, cx, cz, Math.min(left, Math.max(0, Math.round(extra * frac))), sig, minD, rand, cl);
    }
    let g = 0;
    while (sites.length < target && g++ < 8000) {
      tryAdd(sites, -40 + rand() * 80, -8 + rand() * 70, 1.4, null);
    }
    return sites.slice(0, target);
  }
  blob(sites, -5, 3, 180, 6.2, 1.15, rand, "market");
  blob(sites, 3, 9, 70, 7.5, 1.2, rand, "market");
  blob(sites, 16, -1, 48, 4.2, 1.15, rand, "clinic");
  blob(sites, 40, 11, 95, 6.8, 1.2, rand, "east");
  blob(sites, 48, 22, 40, 5.5, 1.25, rand, "east");
  blob(sites, -50, 20, 70, 13, 1.6, rand, "west");
  blob(sites, -38, 36, 45, 9, 1.5, rand, "west");
  blob(sites, 9, 54, 65, 12, 1.55, rand, "south");
  blob(sites, 22, 42, 40, 8, 1.4, rand, "south");
  blob(sites, -22, -14, 35, 9, 1.7, rand, "west");
  blob(sites, 8, 18, 55, 9.5, 1.35, rand, "south");
  along(
    sites,
    [
      [-58, 8],
      [-36, 14],
      [-14, 7],
      [6, 16],
      [24, 11],
      [44, 18],
    ],
    55,
    3.8,
    1.25,
    rand,
  );
  along(
    sites,
    [
      [-8, 28],
      [4, 41],
      [18, 38],
      [12, 58],
      [28, 64],
    ],
    40,
    4.2,
    1.35,
    rand,
  );
  let iso = 0;
  let g = 0;
  while (iso < 55 && g++ < 4000) {
    const x = -70 + rand() * 140;
    const z = -20 + rand() * 100;
    if (tryAdd(sites, x, z, 6.5, null)) iso += 1;
  }
  g = 0;
  while (sites.length < TARGET_HOMES && g++ < 25000) {
    const x = -72 + rand() * 148;
    const z = -22 + rand() * 108;
    tryAdd(sites, x, z, 1.2, null);
  }
  return sites.slice(0, TARGET_HOMES);
}

function houseName(i) {
  if (i < CORE_NAMES.length) return CORE_NAMES[i];
  return GIVEN[(i - CORE_NAMES.length) % GIVEN.length];
}

function loadTraits(i, rural) {
  const r = mulberry(0x51ed ^ Math.imul(i + 1, 0x9e3779b9));
  return {
    loadScale: rural ? 0.38 + r() * 1.15 : 0.48 + r() * 1.45,
    fridgeW: rural ? 12 + r() * 22 : 20 + r() * 32,
    cookDinner: r() > 0.14,
    cookBreakfast: r() > 0.48,
    dinnerOff: Math.floor(r() * 110),
    dinnerDur: 35 + Math.floor(r() * 55),
    cookW: rural ? 80 + r() * 90 : 130 + r() * 180,
    laundry: r() > 0.7,
    laundryOff: Math.floor(r() * 280),
    pump: rural && r() > 0.52,
    ag: rural && r() > 0.38,
    ict: !rural && r() > 0.32,
    ictW: 14 + r() * 48,
    awayDay: r() > 0.84,
    tools: r() > 0.92,
    heat: r() > 0.68,
    payVia: r() < 0.5 ? "vendor" : r() < 0.78 ? "phone" : "ciu",
  };
}

function buildHouses() {
  const sites = buildSites();
  return sites.map((site, i) => {
    const p = PROFILES[i % PROFILES.length];
    const name = houseName(i);
    const rural = site[2] === "west" || site[2] === "south";
    const h = {
      id: `h${i}`,
      name,
      serial: `SM-${String(i).padStart(4, "0")}${name.slice(0, 1).toUpperCase()}`,
      x: site[0],
      z: site[1],
      cluster: site[2],
      startCredit: i === 3 ? 80 : 0,
      ...p,
      ...loadTraits(i, rural),
      payments: [{ min: 6 * 60 + 12 + (i % 18) * 9, amount: 480 + (i % 7) * 90 }],
    };
    if (i < 24) Object.assign(h, { cookDinner: true, awayDay: false });
    if (i === 0) Object.assign(h, { loadLimitW: 250, payments: [{ min: 7 * 60 + 15, amount: 1500 }] });
    if (i === 1) {
      Object.assign(h, {
        loadLimitW: 400,
        payments: [
          { min: 8 * 60, amount: 350 },
          { min: 21 * 60 + 10, amount: 800 },
        ],
      });
    }
    if (i === 2) Object.assign(h, { fridgeW: 58, loadLimitW: 150, payments: [{ min: 6 * 60 + 30, amount: 2000 }] });
    if (i === 3) Object.assign(h, { pump: true, payments: [{ min: 16 * 60, amount: 600 }] });
    if (i === 4) Object.assign(h, { loadLimitW: 250, payments: [{ min: 12 * 60, amount: 1000 }] });
    if (i === 5) {
      Object.assign(h, {
        peakW: 500,
        peakStart: 12 * 60,
        peakEnd: 16 * 60,
        peakLoad: "productive",
        loadLimitW: 550,
        dayLoad: "productive",
        tools: true,
        payments: [{ min: 7 * 60, amount: 300 }],
      });
    }
    if (i >= 24) {
      Object.assign(h, {
        loadLimitW: rural ? 180 : 240,
        payments: [{ min: 6 * 60 + 15 + (i % 22) * 8, amount: rural ? 400 : 640 }],
      });
    }
    return h;
  });
}

export const HOUSES = buildHouses();

/** Matches sim LANDMARKS.xfmr — feeder trunks start here. */
export const MAIN_XFMR = { x: -18.0, z: -6.0 };
export const MAIN_GEN = { x: -26.0, z: -11.0 };

function findParent(parent, a) {
  return parent[a] === a ? a : (parent[a] = findParent(parent, parent[a]));
}

function kruskal(nodes) {
  const parent = Object.fromEntries(nodes.map((n) => [n.id, n.id]));
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      edges.push({ a: a.id, b: b.id, ax: a.x, az: a.z, bx: b.x, bz: b.z, d: (a.x - b.x) ** 2 + (a.z - b.z) ** 2 });
    }
  }
  edges.sort((x, y) => x.d - y.d);
  const kept = [];
  for (const e of edges) {
    const pa = findParent(parent, e.a);
    const pb = findParent(parent, e.b);
    if (pa === pb) continue;
    parent[pa] = pb;
    kept.push(e);
    if (kept.length === nodes.length - 1) break;
  }
  return kept;
}

function densifySegs(edges, step, extra) {
  const out = [];
  const poles = [];
  for (const e of edges) {
    const len = Math.sqrt(e.d) || Math.hypot(e.bx - e.ax, e.bz - e.az);
    const n = Math.max(1, Math.round(len / step));
    let px = e.ax;
    let pz = e.az;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = e.ax + (e.bx - e.ax) * t;
      const z = e.az + (e.bz - e.az) * t;
      out.push({ ax: px, az: pz, bx: x, bz: z, ...extra });
      if (i < n) poles.push({ x, z });
      px = x;
      pz = z;
    }
  }
  return { segs: out, poles };
}

function farthestSeeds(hs, k) {
  const seeds = [hs[0]];
  while (seeds.length < k && seeds.length < hs.length) {
    let best = hs[0];
    let bd = -1;
    for (const h of hs) {
      let md = Infinity;
      for (const s of seeds) {
        const d = (h.x - s.x) ** 2 + (h.z - s.z) ** 2;
        if (d < md) md = d;
      }
      if (md > bd) {
        bd = md;
        best = h;
      }
    }
    seeds.push(best);
  }
  return seeds.map((s) => ({ x: s.x, z: s.z }));
}

function buildGrid(houses) {
  const feeders = [];
  const transformers = [];
  const segs = [];
  const poles = [];
  const byCluster = Object.fromEntries(CLUSTERS.map((c) => [c.id, []]));
  for (const h of houses) (byCluster[h.cluster] || (byCluster[h.cluster] = [])).push(h);

  segs.push({
    ax: MAIN_GEN.x,
    az: MAIN_GEN.z,
    bx: MAIN_XFMR.x,
    bz: MAIN_XFMR.z,
    kind: "trunk",
    feederId: null,
    xfmrId: null,
    capW: 68000,
  });

  for (const c of CLUSTERS) {
    const hs = byCluster[c.id] || [];
    if (!hs.length) continue;
    const feederId = `f-${c.id}`;
    const head = {
      x: c.x + (MAIN_XFMR.x - c.x) * 0.28,
      z: c.z + (MAIN_XFMR.z - c.z) * 0.28,
    };
    feeders.push({ id: feederId, cluster: c.id, label: `${c.label} feeder`, x: head.x, z: head.z });

    segs.push({
      ax: MAIN_XFMR.x,
      az: MAIN_XFMR.z,
      bx: head.x,
      bz: head.z,
      kind: "trunk",
      feederId,
      xfmrId: null,
      capW: Math.max(8000, hs.length * 180),
    });

    const k = Math.max(2, Math.round(hs.length / 14));
    let cents = farthestSeeds(hs, k);
    const assign = () => {
      for (const h of hs) {
        let bi = 0;
        let bd = Infinity;
        for (let i = 0; i < cents.length; i++) {
          const d = (h.x - cents[i].x) ** 2 + (h.z - cents[i].z) ** 2;
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }
        h._ti = bi;
      }
    };
    for (let iter = 0; iter < 4; iter++) {
      assign();
      const nx = cents.map(() => ({ x: 0, z: 0, n: 0 }));
      for (const h of hs) {
        nx[h._ti].x += h.x;
        nx[h._ti].z += h.z;
        nx[h._ti].n += 1;
      }
      cents = nx.map((p, i) => (p.n ? { x: p.x / p.n, z: p.z / p.n } : cents[i]));
    }
    assign();

    const group = cents.map(() => []);
    for (const h of hs) group[h._ti].push(h);

    const xfmrNodes = [{ id: `${feederId}-head`, x: head.x, z: head.z }];
    group.forEach((ghs, i) => {
      if (!ghs.length) return;
      const t = {
        id: `t-${c.id}-${i}`,
        feederId,
        cluster: c.id,
        x: cents[i].x,
        z: cents[i].z,
        n: ghs.length,
        capW: Math.max(1200, ghs.length * 220),
        label: `pole xfmr · ${c.id} ${i + 1}`,
      };
      transformers.push(t);
      xfmrNodes.push({ id: t.id, x: t.x, z: t.z });
      for (const h of ghs) {
        h.feederId = feederId;
        h.xfmrId = t.id;
      }
      const secNodes = [{ id: t.id, x: t.x, z: t.z }, ...ghs.map((h) => ({ id: h.id, x: h.x, z: h.z }))];
      for (const e of kruskal(secNodes)) {
        const houseId = e.a.startsWith("h") ? e.a : e.b.startsWith("h") ? e.b : null;
        segs.push({
          ax: e.ax,
          az: e.az,
          bx: e.bx,
          bz: e.bz,
          kind: "secondary",
          feederId,
          xfmrId: t.id,
          houseId,
          capW: t.capW,
        });
      }
    });

    const prim = densifySegs(kruskal(xfmrNodes), 7.2, { kind: "primary", feederId, xfmrId: null, capW: hs.length * 180 });
    segs.push(...prim.segs);
    for (const p of prim.poles) poles.push({ ...p, feederId });
  }

  return { feeders, transformers, segs, poles };
}

const GRID = buildGrid(HOUSES);
export const FEEDERS = GRID.feeders;
export const TRANSFORMERS = GRID.transformers;
export const GRID_SEGS = GRID.segs;
export const POLES = GRID.poles;

export const VENDORS = [
  { id: "v-kiosk", label: "market kiosk", x: -3.0, z: 0.2, kind: "kiosk" },
  ...FEEDERS.map((f) => ({
    id: `v-agent-${f.cluster}`,
    label: `${CLUSTERS.find((c) => c.id === f.cluster)?.label || f.cluster} agent`,
    x: f.x + 1.5,
    z: f.z - 1.2,
    kind: "agent",
    cluster: f.cluster,
  })),
];

for (const h of HOUSES) {
  let best = VENDORS[0];
  let bd = Infinity;
  for (const v of VENDORS) {
    const d = (h.x - v.x) ** 2 + (h.z - v.z) ** 2;
    const w = v.cluster && v.cluster === h.cluster ? d * 0.3 : d;
    if (w < bd) {
      bd = w;
      best = v;
    }
  }
  h.vendorId = best.id;
}

export const PHASES = ["A", "B", "C"];

for (let i = 0; i < HOUSES.length; i++) {
  const h = HOUSES[i];
  let phase = PHASES[i % 3];
  if (h.cluster === "west" && i % 5 === 0) phase = "A";
  if (h.cluster === "market" && i % 4 === 0) phase = "B";
  h.phase = phase;
}

/** One DitroniX DTM (IPEM-class 3φ monitor) at each feeder takeoff. */
export const DTMS = FEEDERS.map((f) => ({
  id: `dtm-${f.cluster}`,
  feederId: f.id,
  cluster: f.cluster,
  x: f.x + 0.85,
  z: f.z + 0.55,
  label: `DTM · ${f.cluster}`,
}));

/** Pole MeshEMS: 10 homes / board, grouped along each feeder. Last board may be short. */
export const HOMES_PER_BOARD = 10;

function buildBoards(houses) {
  const boards = [];
  const byFeeder = {};
  for (const h of houses) (byFeeder[h.feederId || "_"] ||= []).push(h);
  let n = 0;
  for (const group of Object.values(byFeeder)) {
    const cx = group.reduce((s, h) => s + h.x, 0) / group.length;
    const cz = group.reduce((s, h) => s + h.z, 0) / group.length;
    group.sort((a, b) => Math.atan2(a.z - cz, a.x - cx) - Math.atan2(b.z - cz, b.x - cx));
    for (let i = 0; i < group.length; i += HOMES_PER_BOARD) {
      const hs = group.slice(i, i + HOMES_PER_BOARD);
      n += 1;
      const id = `ems-${n}`;
      const mx = hs.reduce((s, h) => s + h.x, 0) / hs.length;
      const mz = hs.reduce((s, h) => s + h.z, 0) / hs.length;
      const xf = TRANSFORMERS.find((t) => t.id === hs[0].xfmrId);
      let x = mx;
      let z = mz;
      if (xf) {
        const dx = xf.x - mx;
        const dz = xf.z - mz;
        const len = Math.hypot(dx, dz) || 1;
        x = mx + (dx / len) * 0.85;
        z = mz + (dz / len) * 0.85;
      }
      boards.push({
        id,
        feederId: hs[0].feederId,
        xfmrId: hs[0].xfmrId,
        cluster: hs[0].cluster,
        x,
        z,
        houseIds: hs.map((h) => h.id),
        label: `MeshEMS · ${hs[0].cluster} ${n}`,
      });
      for (const h of hs) h.boardId = id;
    }
  }
  return boards;
}

export const BOARDS = buildBoards(HOUSES);

/** One LV station at the main xfmr — all feeders hang off it. */
export const STATIONS = [
  {
    id: "st-main",
    label: "Village station",
    x: MAIN_XFMR.x,
    z: MAIN_XFMR.z,
    feederIds: FEEDERS.map((f) => f.id),
  },
];

/** -Z is north (south hamlet sits at +Z; east at +X). Sun arcs through south. */
export const NORTH = { x: 0, z: -1 };

function pickPvHouses() {
  const ids = [];
  for (const h of HOUSES) {
    const i = Number(String(h.id).replace(/\D/g, "")) || 0;
    const rural = h.cluster === "west" || h.cluster === "south";
    if (i === 2 || i === 3 || i === 5) ids.push(h.id);
    else if (h.cluster === "clinic" && i % 6 === 0) ids.push(h.id);
    else if (rural && ((h.pump && i % 3 === 0) || i % 16 === 0)) ids.push(h.id);
    else if (h.cluster === "market" && i % 24 === 0) ids.push(h.id);
    else if (h.cluster === "east" && i % 20 === 0) ids.push(h.id);
  }
  return [...new Set(ids)];
}

export const PV_ROOF_IDS = pickPvHouses();

export const PV_FARM = {
  x: MAIN_GEN.x - 5.5,
  z: MAIN_GEN.z - 4.2,
  rows: TARGET_HOMES >= 200 ? 3 : 2,
  cols: TARGET_HOMES >= 200 ? 7 : 3,
  label: "PV farm",
};

export const BESS = [
  { id: "bess-main", x: MAIN_GEN.x + 2.4, z: MAIN_GEN.z + 1.6, w: 2.1, h: 1.15, d: 1.2, label: "BESS" },
  { id: "bess-clinic", x: 13.4, z: -5.2, w: 1.15, h: 0.85, d: 0.7, label: "clinic BESS" },
  { id: "bess-ops", x: 18.2, z: -9.6, w: 0.9, h: 0.7, d: 0.55, label: "ops UPS" },
];

export const BESS_HOME_IDS = PV_ROOF_IDS.filter((id) => {
  const h = HOUSES.find((x) => x.id === id);
  if (!h) return false;
  const i = Number(String(id).replace(/\D/g, "")) || 0;
  return h.cluster === "west" || h.cluster === "south" || h.cluster === "clinic" || i % 3 === 0;
}).slice(0, TARGET_HOMES >= 200 ? 18 : 4);

const feederById = Object.fromEntries(FEEDERS.map((f) => [f.id, f]));
const eastTop = TRANSFORMERS.filter((t) => t.cluster === "east").sort((a, b) => b.n - a.n)[0];

export const OUTAGES = [
  {
    id: "o-west",
    min: 8 * 60,
    restore: 9 * 60 + 15,
    feederId: "f-west",
    xfmrId: null,
    kind: "line",
    note: "West feeder spur fault · fuse at takeoff",
    x: feederById["f-west"]?.x ?? -40,
    z: feederById["f-west"]?.z ?? 16,
    label: "west primary",
  },
  {
    id: "o-east",
    min: 11 * 60 + 30,
    restore: 12 * 60 + 45,
    feederId: null,
    xfmrId: eastTop?.id || null,
    kind: "xfmr",
    note: `East pole xfmr over-temp · ${eastTop?.n || 0} customers`,
    x: eastTop?.x ?? 40,
    z: eastTop?.z ?? 12,
    label: eastTop?.label || "east xfmr",
  },
  {
    id: "o-south",
    min: 14 * 60,
    restore: 15 * 60 + 15,
    feederId: "f-south",
    xfmrId: null,
    kind: "line",
    note: "South lateral open · tree on line",
    x: feederById["f-south"]?.x ?? 10,
    z: feederById["f-south"]?.z ?? 40,
    label: "south primary",
  },
  {
    id: "o-market",
    min: 17 * 60,
    restore: 18 * 60 + 30,
    feederId: "f-market",
    xfmrId: null,
    kind: "overload",
    note: "Market feeder overload · evening cooking",
    x: feederById["f-market"]?.x ?? -6,
    z: feederById["f-market"]?.z ?? 2,
    label: "market feeder",
  },
];
