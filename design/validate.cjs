const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "screens.figma.json"), "utf8"),
);
const ids = new Set(data.screens.map((s) => s.id));
assert.equal(ids.size, data.screens.length, "IDs de telas duplicados");
const links = [],
  components = new Map();
let nodes = 0,
  texts = 0,
  auto = 0;
function visit(n, screen) {
  nodes++;
  for (const key of ["x", "y", "width", "height"])
    assert(Number.isFinite(n[key]), `${screen}/${n.name}: ${key} inválido`);
  assert(n.width >= 0 && n.height >= 0, "Dimensão negativa");
  if (n.type === "TEXT") {
    texts++;
    assert(n.fontSize > 0 && n.lineHeight > 0, "Tipografia inválida");
  }
  if (n.layout && n.layout !== "NONE") auto++;
  if (n.target) links.push([screen, n.target]);
  if (n.component)
    components.set(n.component, (components.get(n.component) || 0) + 1);
  for (const c of n.children || []) visit(c, screen);
}
for (const s of data.screens) visit(s, s.id);
const missing = links.filter(([, target]) => !ids.has(target));
assert.deepEqual(missing, [], "Links sem destino");
const graph = new Map();
for (const [source, target] of links) {
  if (!graph.has(source)) graph.set(source, new Set());
  graph.get(source).add(target);
}
const journey = [
  "home",
  "new",
  "created",
  "send",
  "sent",
  "approve",
  "approved",
  "new-trip",
  "new-trip-success",
  "sale",
  "sale-success",
  "finance",
  "receive",
  "received",
];
for (let i = 1; i < journey.length; i++)
  assert(
    graph.get(journey[i - 1])?.has(journey[i]),
    `Fluxo interrompido: ${journey[i - 1]} → ${journey[i]}`,
  );
const lum = (h) => {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const pairs = [
  ["Texto", "#172d39", "#f5f4f0"],
  ["Apoio", "#586b73", "#fffefb"],
  ["Botão", "#ffffff", "#154f63"],
  ["Sucesso", "#246447", "#e8f2eb"],
  ["Atenção", "#835516", "#fcf0d9"],
  ["Erro", "#ac3438", "#fbedee"],
];
const contrast = pairs.map(([name, a, b]) => {
  const l1 = lum(a),
    l2 = lum(b),
    ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  assert(ratio >= 4.5, `Contraste insuficiente: ${name}`);
  return { name, ratio: +ratio.toFixed(2) };
});
const result = {
  screens: data.screens.length,
  nodes,
  texts,
  autoLayoutContainers: auto,
  prototypeLinks: links.length,
  componentFamilies: Object.fromEntries(components),
  journey,
  contrast,
  missingDestinations: missing,
  nativeFigmaImport:
    "Pendente de execução e revisão visual no Figma; MCP atingiu limite Starter.",
};
fs.writeFileSync(
  path.join(__dirname, "validation.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
