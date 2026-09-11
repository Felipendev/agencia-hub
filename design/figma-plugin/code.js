/* Figma Plugin API nativa. Importa o JSON exportado do DOM do protótipo.
 * Não usa o MCP nem endpoints de rede. Execute manualmente no Figma Desktop.
 * Cria apenas conteúdo novo; a correção opcional remove somente o frame 4:2
 * desta tarefa após concluir a importação, se nome e arquivo coincidirem.
 */
figma.showUI(__html__, { width: 440, height: 400 });
figma.ui.onmessage = async (msg) => {
  if (msg.type !== "import") return;
  const created = [],
    roots = [],
    links = [],
    cache = new Map(),
    sets = new Map();
  const imported = [];
  try {
    const data = msg.data;
    if (
      data.version !== 1 ||
      !Array.isArray(data.screens) ||
      !data.screens.length
    )
      throw Error("Arquivo inválido.");
    const stamp = "Hub import · " + new Date().toISOString().slice(0, 19);
    const font = data.fontFamily || "Plus Jakarta Sans";
    await Promise.all(
      ["Regular", "Medium", "SemiBold", "Bold"].map((style) =>
        figma.loadFontAsync({ family: font, style }),
      ),
    );
    const nativeVars = await figma.variables.getLocalVariablesAsync();
    let collection = (
      await figma.variables.getLocalVariableCollectionsAsync()
    ).find((c) => c.name === "Hub / Import colors");
    if (!collection)
      collection = figma.variables.createVariableCollection(
        "Hub / Import colors",
      );
    const tokenMap = new Map();
    const toHex = (c) =>
      "#" +
      [c.r, c.g, c.b]
        .map((v) =>
          Math.round(v * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    const styleMap = new Map();
    const localStyles = await figma.getLocalTextStylesAsync();
    const familyWeights = {
      400: "Regular",
      500: "Medium",
      600: "SemiBold",
      700: "Bold",
    };
    function getToken(c) {
      const hex = toHex(c);
      if (tokenMap.has(hex)) return tokenMap.get(hex);
      let v = nativeVars.find((v) => {
        if (v.resolvedType !== "COLOR") return false;
        try {
          const resolved = v.resolveForConsumer(figma.currentPage).value;
          return (
            typeof resolved === "object" &&
            "r" in resolved &&
            toHex(resolved) === hex
          );
        } catch {
          return false;
        }
      });
      if (!v) {
        v = figma.variables.createVariable(
          "color/" + hex.slice(1),
          collection,
          "COLOR",
        );
        v.scopes = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
        v.setValueForMode(collection.defaultModeId, { r: c.r, g: c.g, b: c.b });
        v.setVariableCodeSyntax("WEB", "var(--hub-color-" + hex.slice(1) + ")");
      }
      tokenMap.set(hex, v);
      return v;
    }
    function paint(c) {
      if (!c || c.a === 0) return [];
      const p = figma.variables.setBoundVariableForPaint(
        { type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a ?? 1 },
        "color",
        getToken(c),
      );
      return [p];
    }
    function style(d) {
      const weight = familyWeights[d.fontWeight] || "Regular",
        key = [d.fontSize, d.lineHeight, weight].join("/");
      if (styleMap.has(key)) return styleMap.get(key);
      let s = localStyles.find((s) => s.name === "Hub/Import/" + key);
      if (!s) {
        s = figma.createTextStyle();
        s.name = "Hub/Import/" + key;
        s.fontName = { family: font, style: weight };
        s.fontSize = d.fontSize;
        s.lineHeight = { unit: "PIXELS", value: d.lineHeight };
        s.letterSpacing = { unit: "PIXELS", value: d.letterSpacing || 0 };
      }
      styleMap.set(key, s);
      return s;
    }
    function collectTexts(d, out = []) {
      if (d.type === "TEXT") out.push(d);
      for (const c of d.children || []) collectTexts(c, out);
      return out;
    }
    function registerLinks(node, d) {
      if (d.target) links.push({ node, target: d.target });
      if (node.type === "INSTANCE") return;
      const children = node.children || [];
      for (let i = 0; i < (d.children || []).length; i++)
        if (children[i]) registerLinks(children[i], d.children[i]);
    }
    function createRaw(d) {
      if (d.type === "SVG") {
        const n = figma.createNodeFromSvg(d.svg);
        created.push(n.id);
        n.name = d.name;
        n.resize(d.width, d.height);
        n.x = d.x;
        n.y = d.y;
        return n;
      }
      if (d.type === "TEXT") {
        const n = figma.createText();
        created.push(n.id);
        n.name = d.name || "Text";
        n.fontName = style(d).fontName;
        n.textStyleId = style(d).id;
        n.characters = d.text;
        n.fills = paint(d.color);
        n.resize(Math.max(1, d.width + 0.8), Math.max(1, d.height));
        n.textAutoResize = "HEIGHT";
        n.textAlignHorizontal =
          d.align === "center"
            ? "CENTER"
            : d.align === "right"
              ? "RIGHT"
              : "LEFT";
        n.x = d.x;
        n.y = d.y;
        return n;
      }
      const n = figma.createFrame();
      created.push(n.id);
      n.name = d.name || "Frame";
      n.fills = paint(d.background);
      n.resize(Math.max(1, d.width), Math.max(1, d.height));
      n.cornerRadius = d.radius || 0;
      n.clipsContent = false;
      if (d.borders?.some((v) => v > 0)) {
        n.strokes = paint(d.border);
        n.strokeTopWeight = d.borders[0];
        n.strokeRightWeight = d.borders[1];
        n.strokeBottomWeight = d.borders[2];
        n.strokeLeftWeight = d.borders[3];
        n.strokeAlign = "INSIDE";
      }
      // Flex parents preserve structural auto layout; wrap layouts use measured
      // child positions because Figma and browser line-breaking differ.
      const auto = d.layout !== "NONE" && !d.wrap;
      if (auto) {
        n.layoutMode = d.layout;
        n.primaryAxisSizingMode = "FIXED";
        n.counterAxisSizingMode = "FIXED";
        n.paddingTop = d.padding[0];
        n.paddingRight = d.padding[1];
        n.paddingBottom = d.padding[2];
        n.paddingLeft = d.padding[3];
        n.itemSpacing = d.gap;
        n.primaryAxisAlignItems =
          d.justify === "space-between"
            ? "SPACE_BETWEEN"
            : d.justify === "center"
              ? "CENTER"
              : d.justify === "flex-end"
                ? "MAX"
                : "MIN";
        n.counterAxisAlignItems =
          d.align === "center"
            ? "CENTER"
            : d.align === "flex-end"
              ? "MAX"
              : "MIN";
      }
      for (const child of d.children || []) {
        const c = build(child);
        n.appendChild(c);
        if (auto) {
          c.layoutSizingHorizontal = "FIXED";
          c.layoutSizingVertical = "FIXED";
          if (child.absolute) {
            c.layoutPositioning = "ABSOLUTE";
            c.x = child.x;
            c.y = child.y;
          }
        } else {
          c.x = child.x;
          c.y = child.y;
        }
        if ("constraints" in c && !auto)
          c.constraints = { horizontal: "MIN", vertical: "MIN" };
      }
      n.resize(Math.max(1, d.width), Math.max(1, d.height));
      n.x = d.x;
      n.y = d.y;
      return n;
    }
    function build(d) {
      if (!d.component) return createRaw(d);
      const key =
        d.component + "|" + Math.round(d.width) + "x" + Math.round(d.height);
      let item = cache.get(key);
      if (!item) {
        const raw = createRaw({ ...d, component: null });
        const c = figma.createComponentFromNode(raw);
        created.push(c.id);
        c.name =
          "State=" +
          d.component.split("/").slice(1).join("/") +
          ", Size=" +
          Math.round(d.width) +
          "x" +
          Math.round(d.height);
        c.description =
          "Componente de " +
          d.component +
          ". Layout extraído da proposta revisável. Textos substituíveis. Validar resizing no Figma antes de implementação.";
        const props = [];
        for (const t of c.findAll((n) => n.type === "TEXT")) {
          const prop = c.addComponentProperty(
            "Text " + (props.length + 1),
            "TEXT",
            t.characters,
          );
          t.componentPropertyReferences = { characters: prop };
          props.push(prop);
        }
        const family = d.component.split("/")[0];
        if (!sets.has(family)) sets.set(family, []);
        sets.get(family).push(c);
        item = { component: c, props };
        cache.set(key, item);
      }
      const instance = item.component.createInstance();
      created.push(instance.id);
      const values = collectTexts(d),
        overrides = {};
      item.props.forEach((p, i) => {
        overrides[p] = values[i]?.text || "";
      });
      instance.setProperties(overrides);
      instance.name = d.component;
      instance.resize(Math.max(1, d.width), Math.max(1, d.height));
      instance.x = d.x;
      instance.y = d.y;
      return instance;
    }
    // Use existing three pages so Starter remains supported.
    const pages = figma.root.children;
    const page =
      pages.find((p) => p.name.includes("05 Prototype")) || figma.currentPage;
    await figma.setCurrentPageAsync(page);
    const existingRight = page.children.reduce(
      (m, n) => Math.max(m, n.x + n.width),
      0,
    );
    const byId = new Map();
    for (let i = 0; i < data.screens.length; i++) {
      const d = data.screens[i];
      const n = build({ ...d, component: null });
      page.appendChild(n);
      n.name = d.id + " · " + d.title;
      n.x = existingRight + 120 + (i % 4) * 1560;
      n.y = 120 + Math.floor(i / 4) * 1800;
      n.resize(d.width, Math.min(d.height, d.width < 500 ? 844 : 960));
      n.clipsContent = true;
      n.overflowDirection = "VERTICAL";
      roots.push(n);
      byId.set(d.id, n);
      registerLinks(n, d);
      imported.push({ id: d.id, nodeId: n.id });
      figma.ui.postMessage({
        type: "progress",
        text: "Tela " + (i + 1) + " de " + data.screens.length + ": " + d.title,
      });
    }
    let connected = 0;
    const missing = new Set();
    for (const l of links) {
      const dest = byId.get(l.target);
      if (!dest) {
        missing.add(l.target);
        continue;
      }
      await l.node.setReactionsAsync([
        {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: dest.id,
              navigation: "NAVIGATE",
              transition: {
                type: "DISSOLVE",
                duration: 0.16,
                easing: { type: "EASE_OUT" },
              },
              resetScrollPosition: true,
            },
          ],
        },
      ]);
      connected++;
    }
    const start = byId.get("home");
    if (start)
      page.flowStartingPoints = [
        ...page.flowStartingPoints,
        { nodeId: start.id, name: stamp + " · Cotação à venda" },
      ];
    const mobile = byId.get("public");
    if (mobile)
      page.flowStartingPoints = [
        ...page.flowStartingPoints,
        { nodeId: mobile.id, name: stamp + " · Pedido mobile" },
      ];
    const systemPage =
      pages.find((p) => p.name.includes("01 Components")) || page;
    // One page switch per phase; native plugin supports this without MCP.
    await figma.setCurrentPageAsync(systemPage);
    let ypos = 1100;
    for (const [family, components] of sets) {
      const set = figma.combineAsVariants(components, systemPage);
      created.push(set.id);
      set.name = "Hub import/" + family;
      set.description =
        "Variantes por estado e dimensão observada. Textos editáveis por propriedade.";
      set.x = 80;
      set.y = ypos;
      let x = 24,
        y = 24,
        maxH = 0;
      for (const c of components) {
        if (x + c.width > 1300) {
          x = 24;
          y += maxH + 32;
          maxH = 0;
        }
        c.x = x;
        c.y = y;
        x += c.width + 24;
        maxH = Math.max(maxH, c.height);
      }
      set.resize(1340, y + maxH + 24);
      ypos += set.height + 80;
    }
    // Replace only the known, task-created foundation board after import succeeds.
    if (msg.repair && figma.fileKey === "Z2jTgdEYMGU6VCyvC5sTaV") {
      const old = await figma.getNodeByIdAsync("4:2");
      const source = byId.get("system");
      if (old && old.name === "00 - Foundations / Guia visual" && source) {
        const copy = source.clone();
        systemPage.appendChild(copy);
        copy.name = "00 - Foundations / Guia visual revisado";
        copy.x = old.x;
        copy.y = old.y;
        old.remove();
        created.push(copy.id);
      }
    }
    await figma.setCurrentPageAsync(page);
    if (start) figma.viewport.scrollAndZoomIntoView([start]);
    figma.ui.postMessage({
      type: "done",
      text:
        roots.length +
        " telas criadas; " +
        connected +
        " conexões; " +
        cache.size +
        " variantes.\n" +
        (missing.size
          ? "Destinos não encontrados: " + [...missing].join(", ")
          : "Todos os destinos foram conectados.") +
        "\nRevise visualmente o resultado no Figma.\n" +
        JSON.stringify(imported),
    });
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      text:
        "Importação interrompida: " +
        error.message +
        "\nPode haver conteúdo parcial. Use Desfazer antes de repetir. IDs criados: " +
        created.join(", "),
    });
  }
};
