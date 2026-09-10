/* Exporta a geometria renderizada para um plugin nativo do Figma. Sem rede. */
function exportDesign() {
  const round = (n) => Math.round(n * 100) / 100;
  const color = (s) => {
    const a = s.match(/[\d.]+/g);
    return a
      ? {
          r: +a[0] / 255,
          g: +a[1] / 255,
          b: +a[2] / 255,
          a: a.length > 3 ? +a[3] : 1,
        }
      : null;
  };
  const rect = (r, parent) => ({
    x: round(r.left - parent.left),
    y: round(r.top - parent.top),
    width: round(r.width),
    height: round(r.height),
  });
  function textData(text, r, c, parent) {
    return {
      type: "TEXT",
      name: text.slice(0, 64),
      text,
      ...rect(r, parent),
      fontSize: parseFloat(c.fontSize),
      fontWeight: parseInt(c.fontWeight) || 400,
      lineHeight: parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.5,
      letterSpacing: parseFloat(c.letterSpacing) || 0,
      color: color(c.color),
      align: c.textAlign,
    };
  }
  function visit(el, parent) {
    const c = getComputedStyle(el),
      r = el.getBoundingClientRect();
    if (
      c.display === "none" ||
      c.visibility === "hidden" ||
      r.width <= 0 ||
      r.height <= 0
    )
      return null;
    const data = {
      type: "FRAME",
      name: el.dataset.component || el.className || el.tagName,
      ...rect(r, parent),
      component: el.dataset.component || null,
      target: el.dataset.target || null,
      background: color(c.backgroundColor),
      border: color(c.borderColor),
      borders: [
        c.borderTopWidth,
        c.borderRightWidth,
        c.borderBottomWidth,
        c.borderLeftWidth,
      ].map(parseFloat),
      radius: parseFloat(c.borderRadius) || 0,
      layout: c.display.includes("flex")
        ? c.flexDirection.startsWith("column")
          ? "VERTICAL"
          : "HORIZONTAL"
        : "NONE",
      wrap: c.flexWrap === "wrap",
      gap: parseFloat(c.gap) || 0,
      padding: [
        c.paddingTop,
        c.paddingRight,
        c.paddingBottom,
        c.paddingLeft,
      ].map(parseFloat),
      justify: c.justifyContent,
      align: c.alignItems,
      absolute: c.position === "absolute",
      children: [],
    };
    if (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) {
      const value =
        el.tagName === "SELECT"
          ? el.selectedOptions[0]?.textContent
          : el.value || el.placeholder;
      const tr = {
        left: r.left + parseFloat(c.paddingLeft) + 1,
        top: r.top + parseFloat(c.paddingTop) + 1,
        width:
          r.width - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight) - 2,
        height:
          el.tagName === "TEXTAREA"
            ? r.height - 24
            : parseFloat(c.lineHeight) || 22,
      };
      data.children.push(textData(value || "", tr, c, r));
      data.layout = "NONE";
      return data;
    }
    for (const node of el.childNodes) {
      if (node.nodeType === 1) {
        const child = visit(node, r);
        if (child) data.children.push(child);
      } else if (node.nodeType === 3 && node.textContent.trim()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const tr = range.getBoundingClientRect();
        data.children.push(textData(node.textContent.trim(), tr, c, r));
      }
    }
    return data;
  }
  const screens = [...document.querySelectorAll("[data-screen]")].map((el) => ({
    id: el.dataset.screen,
    title: screenNames[el.dataset.screen] || el.dataset.screen,
    ...visit(el, el.getBoundingClientRect()),
  }));
  const result = {
    version: 1,
    name: "AgênciasHub · Mesa de operação",
    fontFamily: "Plus Jakarta Sans",
    screens,
  };
  const out = document.querySelector("#scene-json");
  out.value = JSON.stringify(result);
  out.hidden = false;
  document.querySelector("#export-status").textContent =
    `${screens.length} telas exportadas. Copie ou salve o JSON para importar no Figma.`;
  return result;
}
if (new URLSearchParams(location.search).has("catalog")) {
  const controls = document.createElement("section");
  controls.className = "stack";
  controls.innerHTML =
    '<h1>Exportação para Figma</h1><button class="btn primary" id="export-scenes">Preparar arquivo de importação</button><p id="export-status" role="status"></p><textarea id="scene-json" aria-label="JSON de importação do Figma" hidden style="width:1000px;height:240px"></textarea>';
  document.body.prepend(controls);
  document
    .querySelector("#export-scenes")
    .addEventListener("click", async () => {
      await document.fonts.ready;
      const data = exportDesign();
      try {
        const response = await fetch("/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw Error("Falha ao salvar");
        document.querySelector("#export-status").textContent =
          data.screens.length + " telas salvas em design/screens.figma.json.";
      } catch {
        document.querySelector("#export-status").textContent =
          "JSON pronto no campo abaixo. Não foi possível salvar pelo servidor local.";
      }
    });
}
