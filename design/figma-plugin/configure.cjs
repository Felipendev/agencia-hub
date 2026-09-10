// Registra no manifest o ID real atribuído pelo Figma, sem inventar um ID.
const fs = require("node:fs");
const path = require("node:path");
const id = process.argv[2];
if (!id || !/^\d+$/.test(id)) {
  console.error(
    "Uso: node design/figma-plugin/configure.cjs ID_NUMERICO_GERADO_PELO_FIGMA",
  );
  process.exit(1);
}
const file = path.join(__dirname, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
manifest.id = id;
fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
console.log("Manifest configurado com o ID fornecido.");
