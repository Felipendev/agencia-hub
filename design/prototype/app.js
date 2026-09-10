/* Protótipo de design. Todos os registros são fictícios e as ações são locais. */
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const link = (label, to, kind = "") =>
  `<a class="btn ${kind}" data-target="${to}" href="#${to}" data-component="Button/${kind || "secondary"}"><span>${label}</span></a>`;
const textLink = (label, to) =>
  `<a class="link" data-target="${to}" href="#${to}">${label}</a>`;
const badge = (label, tone = "") =>
  `<span class="badge ${tone}" data-component="Badge/${tone || "neutral"}">${label}</span>`;
const kv = (label, value) =>
  `<div class="kv"><span>${label}</span><strong>${value}</strong></div>`;
const divider = '<div class="divider"></div>';
const notice = (text, tone = "info", action = "") =>
  `<div role="status" class="notice ${tone}"><p>${text}</p>${action}</div>`;
const head = (title, desc, action = "") =>
  `<div class="pagehead"><div class="stack gap8"><h1>${title}</h1><p class="muted small">${desc}</p></div>${action}</div>`;
const panel = (title, body, action = "") =>
  `<section class="panel"><div class="panelhead"><h2>${title}</h2>${action}</div><div class="panelbody">${body}</div></section>`;
const field = (label, value = "", helper = "", opts = {}) => {
  const id =
    label.toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + ++field.counter;
  return `<div class="field ${opts.error ? "error" : ""}" data-component="Field/${opts.error ? "error" : opts.select ? "select" : "default"}"><label for="${id}">${label}</label>${
    opts.select
      ? `<select id="${id}">${value
          .split("|")
          .map((v) => `<option>${v}</option>`)
          .join("")}</select>`
      : opts.area
        ? `<textarea id="${id}" placeholder="${esc(opts.placeholder || "")}">${esc(value)}</textarea>`
        : `<input id="${id}" value="${esc(value)}" type="${opts.type || "text"}" placeholder="${esc(opts.placeholder || "")}" ${opts.error ? 'aria-invalid="true"' : ""} ${opts.disabled ? "disabled" : ""} ${helper ? `aria-describedby="${id}-help"` : ""}>`
  }${helper ? `<small id="${id}-help">${helper}</small>` : ""}</div>`;
};
field.counter = 0;
const formrow = (...items) => `<div class="formrow">${items.join("")}</div>`;
const nav = [
  ["Hoje", "home", "01"],
  ["Cotações", "quotes", "02"],
  ["Clientes", "clients", "03"],
  ["Viagens", "trips", "04"],
  ["Vendas e caixa", "finance", "05"],
  ["Calculadora de milhas", "calculator", "06"],
];
function shell(body, active = "home", overlay = "", name = "") {
  return `<div class="screen" data-screen="${name || active}"><aside class="sidebar"><div class="stack gap8"><div class="brand">agências<span style="color:#aac4cd">hub</span></div><div class="brand-sub">Horizonte Viagens</div></div><nav class="navgroup" aria-label="Navegação principal"><div class="navlabel">MESA DE OPERAÇÃO</div>${nav.map(([label, to, n]) => `<a class="navitem ${active === to ? "active" : ""}" ${active === to ? 'aria-current="page"' : ""} href="#${to}" data-target="${to}"><span class="navnum">${n}</span><span>${label}</span></a>`).join("")}</nav><nav class="navgroup" aria-label="Gestão"><div class="navlabel">GESTÃO</div><a class="navitem" href="#team" data-target="team">Equipe e acessos</a><a class="navitem" href="#agency" data-target="agency">Agência</a></nav><div class="navfooter"><a class="navitem" href="#states" data-target="states">Guia do protótipo</a><div class="row gap8"><div class="avatar">MC</div><div><h3>Marina Costa</h3><p class="brand-sub">Gestora · Horizonte</p></div></div></div></aside><div class="workspace"><header class="topbar"><div class="row gap8">${link("Menu", "menu", "quiet")}<span>Horizonte Viagens</span><span class="badge">Gestora</span></div><div class="topbar-search"><a href="#quotes" data-target="quotes">Buscar cliente, cotação ou localizador</a><span class="key">/</span>${textLink("Pendências · 5", "home")}</div></header><main class="content">${body}</main></div>${overlay}</div>`;
}
const quoteRows = [
  [
    "Ana Martins",
    "COT-0248",
    "Salvador → Lisboa",
    "18–28 out · 2 adultos",
    "Em cotação",
    "info",
    "Hoje, 18h",
    "R$ 8.460",
    "Marina",
  ],
  [
    "Bruno Almeida",
    "COT-0247",
    "São Paulo → Recife",
    "22–27 set · 1 adulto",
    "Aguardando cliente",
    "warning",
    "Amanhã, 12h",
    "R$ 2.380",
    "Rafael",
  ],
  [
    "Carla Nascimento",
    "COT-0246",
    "Belo Horizonte → Roma",
    "05–16 nov · 2 adultos",
    "Aprovada",
    "success",
    "12 set, 18h",
    "R$ 14.920",
    "Marina",
  ],
  [
    "Diego Rocha",
    "COT-0245",
    "Salvador → Buenos Aires",
    "10–15 dez · 3 adultos",
    "Em cotação",
    "info",
    "12 set, 18h",
    "R$ 9.870",
    "Rafael",
  ],
  [
    "Elisa Santos",
    "COT-0244",
    "Recife → São Paulo",
    "24–27 set · 1 adulto",
    "Aguardando cliente",
    "warning",
    "11 set, 18h",
    "R$ 1.640",
    "Marina",
  ],
  [
    "Fernando Lima",
    "COT-0243",
    "Brasília → Lisboa",
    "02–12 nov · 2 adultos",
    "Expirada",
    "",
    "09 set, 18h",
    "R$ 9.240",
    "Rafael",
  ],
];
function quoteTable(rows = quoteRows) {
  return `<div class="panel"><div class="table" role="table" aria-label="Cotações"><div class="tr th" role="row"><div class="td customer" role="columnheader">Cliente / cotação</div><div class="td route" role="columnheader">Viagem</div><div class="td status" role="columnheader">Etapa</div><div class="td optional" role="columnheader">Validade</div><div class="td amount" role="columnheader">Total</div><div class="td action"></div></div>${rows.map((r, i) => `<div class="tr" role="row" data-search="${r.join(" ")}"><div class="td customer" role="cell"><strong>${r[0]}</strong><small>${r[1]} · ${r[8]}</small></div><div class="td route" role="cell"><strong>${r[2]}</strong><small>${r[3]}</small></div><div class="td status" role="cell">${badge(r[4], r[5])}</div><div class="td optional" role="cell"><span>${r[6]}</span></div><div class="td amount num" role="cell"><strong>${r[7]}</strong></div><div class="td action" role="cell">${textLink("Abrir", i === 0 ? "detail" : "detail-other")}</div></div>`).join("")}</div><div class="pagination"><span>${rows.length} cotações neste recorte</span><div class="row gap8"><span>1 de 1</span><button class="btn" disabled>Anterior</button><button class="btn" disabled>Próxima</button></div></div></div>`;
}
const task = (day, month, title, desc, status, tone, to, action) =>
  `<div class="task"><div class="dateblock"><strong>${day}</strong><span>${month}</span></div><div class="tasktext"><strong>${title}</strong><p>${desc}</p></div>${badge(status, tone)}${textLink(action, to)}</div>`;
function home() {
  return shell(
    `${head("Sua operação hoje", "Quinta-feira, 10 de setembro de 2026", link("Nova cotação", "new", "primary"))}<div class="summary"><div class="metric"><span>Cotações em andamento</span><strong class="num">24</strong><span>6 aguardam retorno do cliente</span></div><div class="metric"><span>Embarques nos próximos 7 dias</span><strong class="num">08</strong><span>2 check-ins para acompanhar</span></div><div class="metric"><span>A receber nesta semana</span><strong class="num">R$ 18.420</strong><span>R$ 2.380 vencem hoje</span></div><div class="metric"><span>Saldo realizado · setembro</span><strong class="num">R$ 12.640</strong><span>Entradas menos saídas confirmadas</span></div></div><div class="split"><div class="maincol"><section class="panel"><div class="panelhead"><div><h2>O que precisa da sua atenção</h2><p class="small muted">Prazos primeiro. Cada pendência tem um próximo passo.</p></div>${badge("5 pendências", "warning")}</div>${task("10", "SET", "A proposta de Ana vence hoje", "Salvador → Lisboa · COT-0248", "Até 18h", "warning", "detail", "Revisar")}${task("10", "SET", "Parcela de Bruno vence hoje", "Venda V-0182 · parcela 1 de 2 · R$ 2.380", "A receber", "warning", "finance", "Ver venda")}${task("11", "SET", "Embarque de Luciana e Pedro", "Salvador → Guarulhos · localizador HZ9K2L", "Check-in", "info", "trip", "Ver viagem")}${task("12", "SET", "Carla aprovou a proposta", "Belo Horizonte → Roma · 2 adultos", "Aprovada", "success", "detail-other", "Preparar")}${task("12", "SET", "Elisa aguarda confirmação de horário", "Recife → São Paulo · COT-0244", "Retorno", "", "detail-other", "Abrir")}</section>${notice("Aprovação, emissão e recebimento são etapas diferentes. Acompanhe cada uma no seu contexto.")}<p class="productnote">Prioridades calculadas por validade, vencimento e data de embarque. Ordenação proposta para validação.</p></div><aside class="sidecol">${panel("Próximos embarques", `<div class="stack"><div class="row between"><h3>Luciana e Pedro</h3>${badge("Amanhã", "info")}</div><div class="row between"><h2>SSA</h2><span class="muted">→</span><h2>GRU</h2></div><p class="small muted">11 set · 06:10 · LATAM 3351</p>${textLink("Abrir itinerário", "trip")}</div>${divider}<div class="stack gap8"><h3>Rafael Teixeira</h3><p class="small muted">REC → GIG · 14 set · 09:45</p>${textLink("Ver todos os embarques", "trips")}</div>`)}${panel("Visão da equipe", `${kv("Marina Costa", "14 cotações")}${kv("Rafael Mendes", "10 cotações")}${divider}<p class="small muted">Cada agente vê sua carteira. Informações financeiras da agência ficam com a gestão.</p>`)}</aside></div>`,
    "home",
  );
}
function quotes(state = "quotes") {
  const filtered = state === "filtered";
  let body = `${head("Cotações", "Propostas, retornos e aprovações no mesmo lugar.", `<div class="row gap8">${link("Formulário público", "public", "")}${link("Nova cotação", "new", "primary")}</div>`)}<div class="tabs">${[
    ["Todas", "quotes", "24"],
    ["Aguardando retorno", "filtered", "6"],
    ["Aprovadas", "approved-list", "4"],
  ]
    .map(
      ([label, to, count]) =>
        `<a class="tab ${(filtered && to === "filtered") || (!filtered && to === "quotes") ? "active" : ""}" href="#${to}" data-target="${to}">${label}<span>${count}</span></a>`,
    )
    .join(
      "",
    )}<div class="grow"></div>${textLink("Ver quadro", "board")}</div><div class="toolbar"><input class="search" aria-label="Buscar cotações" placeholder="Buscar por cliente, destino ou código"><span class="small muted">Validade: próximas primeiro</span>${link("Filtros", "filters")}</div>`;
  if (filtered)
    body += notice(
      "Etapa: aguardando cliente · 2 resultados no recorte de demonstração",
      "info",
      textLink("Limpar filtros", "quotes"),
    );
  if (state === "deleted")
    body += notice(
      "Cotação COT-0248 movida para a lixeira.",
      "success",
      textLink("Desfazer", "quotes"),
    );
  if (state === "loading")
    body += `<div class="panel" aria-label="Carregando cotações">${Array.from({ length: 6 }, () => '<div class="skeleton-row"><div class="stack gap8"><div class="skeleton"></div><div class="skeleton short"></div></div><div class="skeleton"></div><div class="skeleton"></div></div>').join("")}</div>${notice("Buscando cotações da agência…", "info", textLink("Ver resultado carregado", "quotes"))}`;
  else if (state === "empty" || state === "first")
    body += `<div class="empty"><div class="empty-mark">${state === "first" ? "01" : "⌕"}</div><h2>${state === "first" ? "Sua primeira cotação começa aqui" : "Nenhuma cotação com esses filtros"}</h2><p>${state === "first" ? "Selecione um cliente e registre o que ele procura. Você pode completar a proposta depois." : "Experimente outro destino ou remova os filtros. As cotações da agência continuam disponíveis."}</p>${link(state === "first" ? "Criar primeira cotação" : "Limpar filtros", state === "first" ? "new" : "quotes", "primary")}</div>`;
  else if (state === "error")
    body += `<div class="empty"><div class="empty-mark">!</div><h2>Não foi possível carregar as cotações</h2><p>Houve uma falha de conexão. Tente novamente para recuperar os dados da agência.</p>${link("Tentar novamente", "loading", "primary")}</div>`;
  else
    body += quoteTable(
      filtered
        ? quoteRows.filter((r) => r[4] === "Aguardando cliente")
        : state === "deleted"
          ? quoteRows.slice(1)
          : state === "approved-list"
            ? quoteRows.filter((r) => r[4] === "Aprovada")
            : quoteRows,
    );
  if (state === "partial")
    body += notice(
      "A lista foi carregada. As solicitações do formulário público estão indisponíveis no momento.",
      "warning",
      textLink("Tentar novamente", "quotes"),
    );
  return shell(body, "quotes", "", state);
}
function detail(state = "detail") {
  const approved = state === "approved",
    saved = state === "created" || state === "edited",
    sent = state === "sent";
  return shell(
    `${head("Salvador → Lisboa", "COT-0248 · Ana Martins · Criada em 09 set 2026", `<div class="row gap8">${link("Editar", "edit")}${link(approved ? "Registrar viagem" : "Preparar envio", approved ? "new-trip" : "send", "primary")}</div>`)}<div class="breadcrumb"><a href="#quotes" data-target="quotes">Cotações</a><span>/</span><span>COT-0248</span></div>${saved ? notice(state === "created" ? "Cotação criada. Revise as opções antes de enviar ao cliente." : "Alterações salvas na cotação.", "success") : ""}${sent ? notice("Envio demonstrado. Nenhuma mensagem foi enviada para fora deste protótipo.", "success") : ""}<div class="row wrap">${badge(approved ? "Aprovada" : sent ? "Aguardando cliente" : "Em cotação", approved ? "success" : sent ? "warning" : "info")}<span class="small muted">Responsável: Marina Costa</span><span class="small muted">Validade: hoje, 10 set, às 18h</span></div><div class="split"><div class="maincol">${panel("Pedido da cliente", `${formrow(`<div class="stack gap8 grow"><h3>Ana Martins</h3><p class="small muted">ana.martins@example.com</p>${textLink("Abrir cadastro", "client")}</div>`, `<div class="stack gap8 grow"><h3>2 adultos · ida e volta</h3><p class="small muted">18 a 28 de outubro de 2026</p><p class="small muted">Datas flexíveis: até 2 dias</p></div>`)}${divider}${kv("Serviços solicitados", "Passagem aérea + bagagem")}${kv("Preferências", "Voo direto · 1 mala por pessoa")}${kv("Pagamento desejado", "Pix")}`)}${panel("Proposta de voo", `<div class="row between"><div><h3>Opção 1 · TAP Air Portugal</h3><p class="small muted">Econômica · 2 adultos</p></div>${badge("Voo direto", "info")}</div><div class="itinerary"><div class="airport"><strong>SSA</strong><span class="small">Salvador</span><span class="small muted">18 out · 23:10</span></div><div class="flightline"><span>TP 28 · 8h10</span>${divider}<span>Chegada no dia seguinte</span></div><div class="airport"><strong>LIS</strong><span class="small">Lisboa</span><span class="small muted">19 out · 11:20</span></div></div>${divider}<div class="row between"><p class="small muted">Volta · LIS → SSA · 28 out · 16:50–21:20</p><span class="small">1 mala de 23 kg / pessoa</span></div>${notice("Tarifa sujeita à disponibilidade até a emissão. Horários e voo ilustrativos.", "warning")}`)}${panel("Histórico", `<div class="timeline"><div class="event"><span class="eventtime">14:32</span><div><h3>Marina incluiu uma opção de voo</h3><p class="small muted">Total atualizado para R$ 8.460.</p></div></div><div class="event"><span class="eventtime">09 set</span><div><h3>Solicitação recebida pelo formulário</h3><p class="small muted">Ana pediu uma viagem para Lisboa.</p></div></div></div>`)}</div><aside class="sidecol">${panel("Resumo da proposta", `${kv("Passagens · 2 adultos", "R$ 7.820")}${kv("Bagagens · ida e volta", "R$ 640")}${divider}<p class="small muted">Total para a cliente</p><div class="quoteprice num">R$ 8.460</div><p class="small muted">R$ 4.230 por pessoa · pagamento via Pix</p>${link(approved ? "Registrar viagem" : "Preparar envio", approved ? "new-trip" : "send", "primary")}${link("Prévia da proposta", "proposal")}`)}${panel("Próxima etapa", `<p class="small muted">${approved ? "A aprovação ainda precisa de emissão e registro financeiro." : "Registre a aprovação apenas depois de receber a confirmação da cliente."}</p>${link(approved ? "Registrar venda" : "Registrar aprovação", approved ? "sale" : "approve")}${textLink("Mover para lixeira", "delete")}`)}</aside></div>`,
    "quotes",
    "",
    state,
  );
}
function newQuote(state = "new") {
  const error = state === "validation";
  return shell(
    `${head("Nova cotação", "Comece pelo pedido. A proposta comercial pode ser completada depois.", link("Cancelar", "quotes"))}<div class="stepper"><span class="current"><span class="stepnum">1</span>Pedido da cliente</span><span><span class="stepnum">2</span>Revisar proposta</span><span><span class="stepnum">3</span>Enviar</span></div>${error ? notice("Revise o campo indicado para criar a cotação.", "danger") : ""}<div class="split"><div class="maincol">${panel("Cliente e responsável", `${formrow(field("Cliente *", "Ana Martins|Bruno Almeida|Carla Nascimento", "", { select: true }), field("Responsável", "Marina Costa|Rafael Mendes", "", { select: true }))}${textLink("Cadastrar nova pessoa", "new-client")}`)}${panel("Qual viagem vamos cotar?", `${formrow(field("Origem *", "Salvador · SSA", "Aeroporto de Salvador"), field("Destino *", error ? "" : "Lisboa · LIS", error ? "Informe o destino da viagem." : "Cidade ou aeroporto", { error, placeholder: "Ex.: Lisboa ou LIS" }))}${formrow(field("Ida *", "2026-10-18", "", { type: "date" }), field("Volta *", "2026-10-28", "", { type: "date" }))}${formrow(field("Adultos", "2", "12 anos ou mais", { type: "number" }), field("Crianças", "0", "2 a 11 anos", { type: "number" }), field("Bebês", "0", "Até 23 meses", { type: "number" }))}${formrow(field("Serviços", "Passagem aérea + bagagem|Passagem aérea|Hospedagem|Pacote", "", { select: true }), field("Flexibilidade", "Até 2 dias|Datas fixas|Até 7 dias", "", { select: true }))}`)}${panel("Contexto do atendimento", field("Observações", "Preferência por voo direto. Uma mala de 23 kg por pessoa.", "Visível somente para a equipe.", { area: true }))}<div class="actionbar">${link("Cancelar", "quotes")}<button class="btn primary" data-action="create" data-target="created" data-component="Button/primary"><span>Criar cotação</span></button></div></div><aside class="sidecol">${panel("Antes de criar", `<p class="small muted">A cotação começa em “Em cotação”. Nenhuma mensagem será enviada à cliente.</p>${divider}${kv("Cliente", "Ana Martins")}${kv("Passageiros", "2 adultos")}${kv("Origem do registro", "Interna")}${divider}<p class="small muted">Documentos pessoais só serão solicitados quando necessários à emissão.</p>`)}</aside></div>`,
    "quotes",
    "",
    state,
  );
}
function trip(state = "trip") {
  return shell(
    `${head("Viagem de Luciana e Pedro", "VIA-0182 · Salvador → São Paulo · 11 a 15 setembro 2026", link("Editar viagem", "edit-trip"))}${state === "trip-created" ? notice("Viagem registrada. O financeiro precisa ser lançado separadamente.", "success", textLink("Registrar venda", "sale")) : ""}${notice("Check-in disponível. Confira os documentos e as orientações de embarque.", "warning")}<div class="split"><div class="maincol">${panel("Itinerário", `<div class="row between">${badge("Próxima viagem", "info")}<h3>Localizador HZ9K2L</h3></div><div class="itinerary"><div class="airport"><strong>SSA</strong><span class="small">Salvador</span><span class="small muted">11 set · 06:10</span></div><div class="flightline"><span>LATAM · LA 3351</span>${divider}<span>Direto · 2h35</span></div><div class="airport"><strong>GRU</strong><span class="small">Guarulhos</span><span class="small muted">11 set · 08:45</span></div></div>${divider}${kv("Retorno", "15 set · 20:00 → 22:20")}${kv("Bagagem", "1 mala de 23 kg por pessoa")}${kv("Serviço", "Passagem aérea")}`)}${panel("Passageiros", `${kv("Luciana Oliveira", "Titular da compra")}${kv("Pedro Oliveira", "Passageiro vinculado")}<p class="small muted">Documentos protegidos. Consulte o cadastro apenas para a emissão.</p>${textLink("Abrir cadastro da titular", "client")}`)}${panel("Acompanhamento", `${kv("Emissão", "Confirmada em 08 set")}${kv("Check-in", "Acompanhar na companhia")}${kv("Orientações de embarque", "Pendente de envio")}${link("Preparar orientações", "trip-instructions")}`)}</div><aside class="sidecol">${panel("Venda vinculada", `${kv("Venda", "V-0181")}${kv("Total", "R$ 4.760")}${kv("Recebido", "R$ 2.380")}${kv("A receber", "R$ 2.380")}${link("Ver contas da venda", "finance")}`)}${panel("Responsável", `<div class="row"><div class="avatar">RM</div><div><h3>Rafael Mendes</h3><p class="small muted">Agente responsável</p></div></div>${textLink("Ver equipe", "team")}`)}</aside></div>`,
    "trips",
    "",
    state,
  );
}
function trips() {
  return shell(
    `${head("Viagens", "Embarques, localizadores e acompanhamento.", link("Registrar viagem", "new-trip", "primary"))}<div class="tabs"><a class="tab active" href="#trips" data-target="trips">Próximas <span>8</span></a><a class="tab" href="#trip" data-target="trip">Em andamento <span>2</span></a></div><div class="toolbar"><input class="search" aria-label="Buscar viagens" placeholder="Cliente, destino ou localizador">${link("Próximos 7 dias", "trips")}</div><section class="panel">${task("11", "SET", "Luciana e Pedro Oliveira", "SSA → GRU · LATAM 3351 · HZ9K2L", "Check-in", "warning", "trip", "Abrir")}${task("14", "SET", "Rafael Teixeira", "REC → GIG · GOL 2041 · RT3D7P", "Próxima", "info", "trip", "Abrir")}${task("17", "SET", "Joana Ribeiro", "BSB → CNF · AZUL 4120 · JR9P4Z", "Próxima", "info", "trip", "Abrir")}</section>`,
    "trips",
  );
}
function newTrip() {
  return shell(
    `${head("Registrar viagem", "COT-0248 aprovada · dados reaproveitados da cotação", link("Voltar à cotação", "approved"))}<div class="split"><div class="maincol">${panel("Reserva e itinerário", `${formrow(field("Cliente", "Ana Martins", "Vinculada à cotação COT-0248", { disabled: true }), field("Serviço", "Passagem aérea|Hospedagem|Pacote", "", { select: true }))}${formrow(field("Localizador", "AN4L8S"), field("Companhia", "TAP Air Portugal"))}${formrow(field("Ida", "2026-10-18", "", { type: "date" }), field("Volta", "2026-10-28", "", { type: "date" }))}${field("Itinerário", "SSA → LIS · 18 out · 23:10\nLIS → SSA · 28 out · 16:50", "Confirme os horários no bilhete emitido.", { area: true })}`)}${notice("Registrar a viagem não cria uma venda nem confirma recebimentos.", "warning")}<div class="actionbar">${link("Cancelar", "approved")}${link("Registrar viagem", "new-trip-success", "primary")}</div></div><aside class="sidecol">${panel("Origem dos dados", `${kv("Cotação", "COT-0248")}${kv("Cliente", "Ana Martins")}${kv("Passageiros", "2 adultos")}<p class="small muted">A proposta aprovada é uma referência. Confira a reserva emitida antes de salvar.</p>`)}</aside></div>`,
    "trips",
    "",
    "new-trip",
  );
}
function newTripSuccess() {
  return shell(
    `${head("Viagem registrada", "VIA-0183 · Ana Martins · Salvador → Lisboa")}${notice("A viagem foi vinculada à cotação COT-0248.", "success")}<div class="split"><div class="maincol">${panel("Reserva confirmada", `${kv("Localizador", "AN4L8S")}${kv("Companhia", "TAP Air Portugal")}${kv("Ida", "18 outubro 2026")}${kv("Volta", "28 outubro 2026")}${kv("Passageiros", "2 adultos")}`)}${panel("Complete o registro financeiro", `<p class="muted">Esta viagem ainda não tem venda vinculada. Registre o valor vendido, as parcelas e os custos.</p><div>${link("Registrar venda", "sale", "primary")}</div>`)}</div><aside class="sidecol">${panel("Rastreabilidade", `${textLink("Voltar à cotação", "approved")}${textLink("Ver todas as viagens", "trips")}`)}</aside></div>`,
    "trips",
    "",
    "new-trip-success",
  );
}
function finance(state = "finance") {
  return shell(
    `${head("Vendas e caixa", "Diferencie o que foi vendido do que já entrou no caixa.", link("Registrar venda", "sale", "primary"))}${state === "received" ? notice("Recebimento de R$ 8.460 registrado no cenário demonstrativo.", "success") : ""}<div class="tabs"><a class="tab active" href="#finance" data-target="finance">A receber</a><a class="tab" href="#payables" data-target="payables">A pagar</a><a class="tab" href="#sales" data-target="sales">Vendas</a></div><div class="summary"><div class="metric"><span>Previsto · próximos 7 dias</span><strong>R$ 18.420</strong></div><div class="metric"><span>Vence hoje</span><strong>R$ ${"2.380"}</strong></div><div class="metric"><span>Já recebido · setembro</span><strong>R$ ${state === "received" ? "51.040" : "42.580"}</strong></div></div><div class="panel"><div class="panelhead"><h2>Parcelas a receber</h2><span class="small muted">Ordenadas por vencimento</span></div><div class="table"><div class="tr th"><div class="td customer">Cliente / venda</div><div class="td">Vencimento</div><div class="td">Parcela</div><div class="td amount">Valor</div><div class="td">Ação</div></div>${[
      ["Bruno Almeida", "V-0182", "10 set 2026", "1 de 2", "2.380"],
      ["Ana Martins", "V-0183", "12 set 2026", "Única", "8.460"],
      ["Carla Nascimento", "V-0184", "14 set 2026", "1 de 2", "7.580"],
    ]
      .map(
        (r, i) =>
          `<div class="tr"><div class="td customer"><strong>${r[0]}</strong><small>${r[1]}</small></div><div class="td">${r[2]}</div><div class="td">${r[3]}</div><div class="td amount"><strong>R$ ${r[4]}</strong></div><div class="td">${i === 1 && state === "received" ? badge("Recebido", "success") : i === 1 ? textLink("Registrar recebimento", "receive") : textLink("Ver exemplo", "finance-other")}</div></div>`,
      )
      .join(
        "",
      )}</div></div>${notice("Confirme o recebimento somente depois que o dinheiro entrar na conta.", "info")}<p class="productnote">Valores fictícios para demonstrar a diferença entre venda, parcela prevista e movimento confirmado.</p>`,
    "finance",
    "",
    state,
  );
}
function sale() {
  return shell(
    `${head("Registrar venda", "Vincule a operação comercial à cotação e à viagem.", link("Cancelar", "new-trip-success"))}<div class="split"><div class="maincol">${panel("Venda e pagamento", `${formrow(field("Cliente", "Ana Martins|Bruno Almeida", "", { select: true }), field("Cotação", "COT-0248 · Salvador → Lisboa", "", { select: true }))}${formrow(field("Valor total vendido", "8.460,00"), field("Data da venda", "2026-09-10", "", { type: "date" }))}${formrow(field("Forma de pagamento", "Pix|Cartão|Transferência", "", { select: true }), field("Parcelas", "1|2|3", "", { select: true }), field("Vencimento", "2026-09-12", "", { type: "date" }))}`)}${panel("Custos e comissão", `${formrow(field("Custo do fornecedor", "7.610,00"), field("Comissão do agente", "250,00"))}${notice("Os custos serão registrados como valores a pagar. O pagamento será confirmado separadamente.", "info")}`)}<div class="actionbar">${link("Cancelar", "new-trip-success")}${link("Registrar venda", "sale-success", "primary")}</div></div><aside class="sidecol">${panel("Conferência", `${kv("Total vendido", "R$ 8.460")}${kv("Fornecedor", "− R$ 7.610")}${kv("Comissão", "− R$ 250")}${divider}${kv("Resultado previsto", "R$ 600")}<p class="small muted">A venda cria previsões. Nenhum valor será marcado como recebido ou pago.</p>`)}</aside></div>`,
    "finance",
    "",
    "sale",
  );
}
function clients() {
  return shell(
    `${head("Clientes", "Uma pessoa, seus contatos e o histórico de viagens.", link("Nova pessoa", "new-client", "primary"))}<div class="toolbar"><input class="search" aria-label="Buscar clientes" placeholder="Buscar por nome, e-mail ou telefone">${link("Todos os perfis", "clients")}</div><section class="panel">${[
      "Ana Martins",
      "Bruno Almeida",
      "Carla Nascimento",
      "Luciana Oliveira",
    ]
      .map(
        (name, i) =>
          `<div class="task"><div class="avatar">${name
            .split(" ")
            .map((s) => s[0])
            .join(
              "",
            )}</div><div class="tasktext"><strong>${name}</strong><p>${name.toLowerCase().split(" ").join(".")}@example.com</p></div>${badge(i === 0 ? "Cliente e passageira" : "Cliente", "info")}${textLink("Abrir cadastro", "client")}</div>`,
      )
      .join(
        "",
      )}</section>${notice("Evite cadastros duplicados: passageiro, cliente e fornecedor são perfis da mesma pessoa.", "info")}`,
    "clients",
  );
}
function client() {
  return shell(
    `${head("Ana Martins", "Cliente e passageira · cadastrada em 09 set 2026", link("Editar cadastro", "edit-client"))}<div class="split"><div class="maincol">${panel("Relacionamento", `${formrow(`<div class="stack gap8 grow"><p class="small muted">E-mail</p><h3>ana.martins@example.com</h3></div>`, `<div class="stack gap8 grow"><p class="small muted">Preferência de contato</p><h3>WhatsApp</h3></div>`)}${divider}<p class="small muted">Prefere voos diretos e uma mala despachada por passageiro.</p>`)}${panel("Cotações e viagens", `<div class="tasktext"><strong>Salvador → Lisboa</strong><p>COT-0248 · 18 a 28 out 2026 · 2 adultos</p>${textLink("Abrir cotação", "detail")}</div>${divider}<p class="small muted">Nenhuma outra viagem neste cadastro de demonstração.</p>`)}${panel("Documentos", `<p class="small muted">Dados de identificação disponíveis somente para pessoas autorizadas.</p>${link("Consultar documentos", "permission")}`)}</div><aside class="sidecol">${panel("Novo atendimento", `<p class="small muted">Use os dados desta pessoa para iniciar um novo pedido.</p>${link("Criar cotação", "new", "primary")}`)}</aside></div>`,
    "clients",
  );
}
function publicForm(state = "public") {
  return `<div class="screen public-screen" data-screen="${state}"><div class="row between"><div class="stack gap8"><div class="brand">Horizonte Viagens</div><p class="small muted">Atendimento com Marina Costa</p></div>${badge("Solicitação")}</div>${state === "public-success" ? `<div class="empty"><div class="empty-mark">✓</div><h1>Recebemos seu pedido</h1><p>A equipe vai analisar sua viagem e entrar em contato pelo canal escolhido.</p><p class="small">Pedido SOL-0318 · Salvador → Lisboa</p>${link("Voltar ao início", "public", "primary")}</div>` : `<div class="stack gap8"><div class="eyebrow">Vamos planejar sua viagem</div><h1>Para onde você quer ir?</h1><p class="muted">Conte o essencial. Nossa equipe prepara as opções para você.</p></div><section class="panel"><div class="panelbody">${formrow(field("Saindo de", "Salvador · SSA"), field("Indo para", "Lisboa · LIS"))}${formrow(field("Ida", "2026-10-18", "", { type: "date" }), field("Volta", "2026-10-28", "", { type: "date" }))}${field("Passageiros", "2 adultos|1 adulto|2 adultos e 1 criança", "", { select: true })}${divider}<h2>Como falamos com você?</h2>${field("Seu nome", "Ana Martins")}${field("E-mail", "ana.martins@example.com", "", { type: "email" })}${field("Canal de contato", "E-mail|WhatsApp", "", { select: true })}<p class="small muted">Usaremos seus dados para responder a esta solicitação. Consulte como tratamos suas informações na Política de Privacidade.</p>${link("Solicitar minha cotação", "public-success", "primary")}</div></section>`}<div class="row wrap gap8">${textLink("Política de Privacidade", "privacy")}${textLink("Termos de Uso", "terms")}</div><p class="productnote">Demonstração com dados fictícios. Nenhuma solicitação é enviada.</p></div>`;
}
function board() {
  return shell(
    `${head("Cotações em andamento", "Quadro para acompanhar etapas. Use a lista para comparar muitos registros.", link("Ver lista", "quotes"))}<div class="board">${[
      ["Em cotação", "2", 0, 3],
      ["Aguardando cliente", "2", 1, 4],
      ["Aprovada", "1", 2],
    ]
      .map(
        ([label, count, ...ids]) =>
          `<section class="lane"><div class="lanehead"><span>${label}</span><span>${count}</span></div>${ids.map((i) => `<article class="deal"><strong>${quoteRows[i][0]}</strong><p>${quoteRows[i][2]}</p><p>${quoteRows[i][3]}</p>${badge(quoteRows[i][6], i === 0 ? "warning" : "")}<div class="row between"><strong>${quoteRows[i][7]}</strong>${textLink("Abrir", i === 2 ? "approved" : "detail")}</div></article>`).join("")}</section>`,
      )
      .join(
        "",
      )}</div><p class="productnote">A mudança de etapa usa ações explícitas no detalhe. Arrastar não é necessário para operar o quadro.</p>`,
    "quotes",
  );
}
function modal(title, body, actions, back = "detail", drawer = false) {
  return `<div class="modalbg ${drawer ? "drawerbg" : ""}"><section class="dialog ${drawer ? "drawer" : ""}" role="dialog" aria-modal="true" aria-label="${title}"><div class="row between"><h2>${title}</h2>${textLink("Fechar", back)}</div>${body}<div class="actionbar">${actions}</div></section></div>`;
}
function withModal(base, overlay, name) {
  return base
    .replace("</main></div>", "</main></div>" + overlay)
    .replace(/data-screen="[^"]+"/, `data-screen="${name}"`);
}
function states() {
  return shell(
    `${head("Guia do protótipo", "Cenários conectados para avaliar o fluxo e suas exceções.")}<div class="panel"><div class="panelbody"><h2>Fluxo principal</h2><p class="muted">Hoje → nova cotação → revisão → envio → aprovação → viagem → venda → recebimento.</p><div>${link("Iniciar pela operação", "home", "primary")}</div>${divider}<h2>Estados e situações</h2><div class="stategrid">${[
      ["Primeiro uso", "first"],
      ["Loading e skeleton", "loading"],
      ["Nenhum resultado", "empty"],
      ["Muitos dados", "quotes"],
      ["Falha de conexão", "error"],
      ["Validação de formulário", "validation"],
      ["Permissão insuficiente", "permission"],
      ["Conteúdo parcial", "partial"],
      ["Confirmação destrutiva", "delete"],
      ["Sucesso e desfazer", "deleted"],
      ["Filtro em drawer", "filters"],
      ["Visão em quadro", "board"],
      ["Formulário público mobile", "public"],
      ["Design System", "system"],
    ]
      .map(([label, to]) => link(label, to))
      .join(
        "",
      )}</div>${divider}<h2>Sobre esta proposta</h2><p class="muted">Dados fictícios. Ações simuladas. Mensagens, vendas e recebimentos não são enviados a serviços externos. No Figma, o fluxo usa cliques entre estados preparados; no navegador, os campos podem ser editados.</p></div></div>`,
    "states",
  );
}
function system() {
  return shell(
    `${head("Design System · base v1", "Componentes compartilhados entre os fluxos.")}<div class="panel"><div class="panelbody"><h2>Cores com função</h2><div class="row wrap">${[
      ["ink", "Texto"],
      ["primary", "Ação"],
      ["warning", "Atenção"],
      ["success", "Sucesso"],
      ["danger", "Erro"],
    ]
      .map(
        ([color, label]) =>
          `<div class="stack gap8" style="width:140px"><div style="height:56px;background:var(--${color})"></div><h3>${label}</h3></div>`,
      )
      .join(
        "",
      )}</div>${divider}<h2>Botões e feedback</h2><div class="row wrap">${link("Salvar alterações", "edited", "primary")}${link("Cancelar", "quotes")}${link("Mover para lixeira", "delete", "danger")}<button class="btn" disabled>Indisponível</button><button class="btn primary" disabled>Salvando…</button>${link("Foco visível", "system", "focus-demo")}</div><div class="row wrap">${badge("Em cotação", "info")}${badge("Aguardando cliente", "warning")}${badge("Aprovada", "success")}${badge("Expirada")}${badge("Falha", "danger")}</div>${divider}<h2>Campos</h2>${formrow(field("Destino *", "Lisboa · LIS", "Cidade ou IATA"), field("Destino *", "", "Informe o destino.", { error: true }), field("Responsável", "Marina Costa|Rafael Mendes", "", { select: true }))}${notice("Alterações salvas.", "success")}${notice("Não foi possível salvar. Seu preenchimento foi preservado.", "danger")}${divider}<h2>Tipografia e geometria</h2><p>Plus Jakarta Sans · 28/36 título · 18/26 seção · 14/22 corpo · 12/18 apoio.</p><p class="small muted">Grid desktop 1440 · sidebar 224 · margem 32 · gap 24. Raio 4 em controles e 8 em overlays. Alvos de toque de 44 px. Tabelas com divisores, sem sombras decorativas.</p></div></div>`,
    "states",
  );
}
function settings(kind) {
  const team = kind === "team";
  return shell(
    `${head(team ? "Equipe e acessos" : "Agência", team ? "Responsabilidade e acesso de cada agente." : "Identidade, atendimento e preferências da agência.", link(team ? "Convidar agente" : "Salvar alterações", team ? "invite" : "settings-success", "primary"))}${panel(team ? "Pessoas da equipe" : "Horizonte Viagens", team ? `${kv("Marina Costa", "Gestora · acesso completo")}${kv("Rafael Mendes", "Agente · própria carteira")}${divider}<p class="small muted">Agentes acessam suas cotações, clientes, viagens e comissões. Valores globais ficam com a gestão.</p>` : `${formrow(field("Nome da agência", "Horizonte Viagens"), field("E-mail de atendimento", "atendimento@example.com"))}${field("Formulário público", "Ativo|Inativo", "", { select: true })}${textLink("Abrir formulário da agência", "public")}`)}`,
    "team",
  );
}
function calculator() {
  return shell(
    `${head("Calculadora de milhas", "Compare o custo da emissão e adicione a opção à cotação.")}${panel("Simular emissão", `${formrow(field("Programa", "LATAM Pass|Smiles|Azul Fidelidade", "", { select: true }), field("Milhas necessárias", "120000"), field("Custo do milheiro (R$)", "25,00"))}${formrow(field("Taxas de embarque (R$)", "420,00"), field("Margem desejada (R$)", "500,00"))}${divider}${kv("Custo das milhas", "R$ 3.000")}${kv("Custo total", "R$ 3.420")}${kv("Preço sugerido", "R$ 3.920")}<p class="small muted">Cenário ilustrativo pré-calculado. Taxas e disponibilidade devem ser conferidas na emissão.</p><div>${link("Adicionar à cotação", "edited", "primary")}</div>`)}`,
    "calculator",
  );
}
const screenNames = {
  home: "Hoje",
  quotes: "Cotações",
  detail: "Detalhe da cotação",
  new: "Nova cotação",
  created: "Cotação criada",
  send: "Preparar envio",
  proposal: "Prévia da proposta",
  sent: "Envio demonstrado",
  approve: "Confirmar aprovação",
  approved: "Cotação aprovada",
  "new-trip": "Registrar viagem",
  "new-trip-success": "Viagem registrada",
  sale: "Registrar venda",
  "sale-success": "Venda registrada",
  finance: "Vendas e caixa",
  receive: "Confirmar recebimento",
  received: "Recebimento registrado",
  trips: "Viagens",
  trip: "Detalhe da viagem",
  clients: "Clientes",
  client: "Cadastro do cliente",
  edit: "Editar cotação",
  edited: "Cotação editada",
  delete: "Confirmar exclusão",
  deleted: "Cotação excluída",
  filters: "Filtros",
  filtered: "Resultado filtrado",
  loading: "Carregamento",
  empty: "Sem resultados",
  first: "Primeiro uso",
  error: "Falha de conexão",
  validation: "Erro de validação",
  permission: "Sem permissão",
  partial: "Dados parciais",
  board: "Quadro",
  public: "Solicitação pública mobile",
  "public-success": "Solicitação recebida mobile",
  system: "Componentes e tokens",
  states: "Guia do protótipo",
  team: "Equipe",
  agency: "Agência",
  calculator: "Calculadora de milhas",
};
function renderScreen(name) {
  if (name === "home") return home();
  if (
    [
      "quotes",
      "filtered",
      "deleted",
      "loading",
      "empty",
      "first",
      "error",
      "partial",
      "approved-list",
    ].includes(name)
  )
    return quotes(name);
  if (["detail", "approved", "created", "edited", "sent"].includes(name))
    return detail(name);
  if (name === "new" || name === "validation") return newQuote(name);
  if (name === "trip") return trip();
  if (name === "trips") return trips();
  if (name === "new-trip") return newTrip();
  if (name === "new-trip-success") return newTripSuccess();
  if (["finance", "received"].includes(name)) return finance(name);
  if (name === "sale") return sale();
  if (name === "clients") return clients();
  if (name === "client") return client();
  if (name === "public" || name === "public-success") return publicForm(name);
  if (name === "board") return board();
  if (name === "system") return system();
  if (name === "states") return states();
  if (name === "team" || name === "agency") return settings(name);
  if (name === "calculator") return calculator();
  if (name === "delete")
    return withModal(
      detail(),
      modal(
        "Mover cotação para a lixeira?",
        `<p>A cotação COT-0248 de Ana Martins sairá da lista de trabalho.</p><p class="small muted">A pessoa cadastrada será mantida. A recuperação pela lixeira depende das permissões da agência.</p>`,
        link("Manter cotação", "detail") +
          link("Mover para lixeira", "deleted", "danger"),
      ),
      "delete",
    );
  if (name === "approve")
    return withModal(
      detail(),
      modal(
        "Registrar aprovação de Ana?",
        `<p>Confirme que a cliente aprovou a proposta de R$ 8.460.</p>${notice("A aprovação não emite bilhetes nem confirma pagamentos.", "warning")}`,
        link("Cancelar", "detail") +
          link("Registrar aprovação", "approved", "primary"),
      ),
      "approve",
    );
  if (name === "receive")
    return withModal(
      finance(),
      modal(
        "Confirmar recebimento",
        `${kv("Cliente", "Ana Martins")}${kv("Venda / parcela", "V-0183 · única")}${kv("Valor", "R$ 8.460")}${field("Data do recebimento", "2026-09-10", "", { type: "date" })}${field("Conta de destino", "Conta operacional|Caixa", "", { select: true })}${notice("Confirme apenas após verificar a entrada na conta.", "warning")}`,
        link("Cancelar", "finance") +
          link("Confirmar recebimento", "received", "primary"),
        "finance",
      ),
      "receive",
    );
  if (name === "filters")
    return withModal(
      quotes(),
      modal(
        "Filtrar cotações",
        `${field("Etapa", "Aguardando cliente|Todas|Em cotação|Aprovada", "", { select: true })}${field("Responsável", "Todos|Marina Costa|Rafael Mendes", "", { select: true })}${field("Validade a partir de", "2026-09-10", "", { type: "date" })}<p class="small muted">Os filtros permanecem ao abrir e retornar de um detalhe.</p>`,
        link("Limpar", "quotes") +
          link("Aplicar filtros", "filtered", "primary"),
        "quotes",
        true,
      ),
      "filters",
    );
  if (name === "edit")
    return withModal(
      detail(),
      modal(
        "Editar cotação",
        `${field("Título", "Salvador → Lisboa")}${formrow(field("Total da proposta", "8.460,00"), field("Validade", "2026-09-10", "", { type: "date" }))}${field("Observações", "Confirmar bagagem antes da emissão.", "Somente para a equipe.", { area: true })}`,
        link("Descartar alterações", "detail") +
          link("Salvar alterações", "edited", "primary"),
      ),
      "edit",
    );
  if (name === "send")
    return withModal(
      detail(),
      modal(
        "Preparar envio para Ana",
        `${kv("Destinatária", "Ana Martins")}${kv("Canal", "WhatsApp")}${field("Mensagem", "Ana, preparei a opção Salvador–Lisboa para 2 adultos, de 18 a 28 de outubro. Total: R$ 8.460. A tarifa vale até hoje às 18h, sujeita à disponibilidade.", "Revise o texto e a proposta antes de enviar.", { area: true })}${textLink("Abrir prévia da proposta", "proposal")}`,
        link("Cancelar", "detail") + link("Simular envio", "sent", "primary"),
      ),
      "send",
    );
  if (name === "proposal")
    return shell(
      `${head("Sua proposta para Lisboa", "Horizonte Viagens · preparada para Ana Martins", link("Voltar à revisão", "send"))}${panel("18 a 28 outubro 2026", `<h1>Salvador → Lisboa</h1><p>2 adultos · ida e volta · TAP Air Portugal</p>${kv("Ida", "18 out · 23:10 → 19 out · 11:20")}${kv("Volta", "28 out · 16:50 → 21:20")}${kv("Bagagem", "1 mala de 23 kg por pessoa")}${divider}<p class="small muted">Total para 2 pessoas</p><div class="quoteprice">R$ 8.460</div><p class="small muted">Pagamento via Pix. Tarifa sujeita à disponibilidade até a emissão. Validade: 10 set 2026, às 18h.</p>`)}`,
      "quotes",
      "",
      "proposal",
    );
  if (name === "permission")
    return shell(
      `${head("Acesso restrito", "Seu perfil não permite consultar esta informação.")}<div class="empty"><div class="empty-mark">—</div><h2>Documentos protegidos</h2><p>Peça ao gestor da agência que revise seu acesso, se estes dados forem necessários para seu atendimento.</p>${link("Voltar ao cadastro", "client", "primary")}</div>`,
      "clients",
      "",
      "permission",
    );
  if (name === "sale-success")
    return shell(
      `${head("Venda V-0183 registrada", "Ana Martins · vinculada à cotação COT-0248")}${notice("Uma parcela a receber de R$ 8.460 foi criada para 12 set 2026.", "success")}${panel("Próximo passo", `<p class="muted">Acompanhe o vencimento no financeiro. Confirme o recebimento quando o dinheiro entrar.</p>${kv("Resultado previsto", "R$ 600")}${kv("Viagem de origem", "VIA-0183")}<div>${link("Ver contas a receber", "finance", "primary")}</div>`)}`,
      "finance",
      "",
      "sale-success",
    );
  if (name === "menu")
    return shell(
      `${head("Navegação", "Escolha a área de trabalho.")}<div class="stack">${nav.map(([label, to]) => link(label, to)).join("")}${link("Guia do protótipo", "states")}</div>`,
      "home",
      "",
      "menu",
    );
  if (name === "new-client" || name === "edit-client")
    return withModal(
      clients(),
      modal(
        name === "new-client" ? "Nova pessoa" : "Editar pessoa",
        `${field("Nome completo", "Ana Martins")}${field("E-mail", "ana.martins@example.com")}${field("Perfil", "Cliente e passageira|Cliente|Fornecedor", "", { select: true })}<p class="small muted">Busque uma pessoa existente antes de criar outra.</p>`,
        link("Cancelar", "clients") +
          link("Salvar pessoa", "client", "primary"),
        "clients",
      ),
      name,
    );
  if (name === "edit-trip")
    return withModal(
      trip(),
      modal(
        "Editar viagem",
        `${field("Localizador", "HZ9K2L")}${field("Observações", "Enviar orientações de embarque.", "", { area: true })}`,
        link("Cancelar", "trip") + link("Salvar viagem", "trip", "primary"),
        "trip",
      ),
      "edit-trip",
    );
  if (name === "trip-instructions")
    return withModal(
      trip(),
      modal(
        "Orientações de embarque",
        `<p>Luciana, seu voo sai de Salvador em 11/09 às 06:10. Confira os documentos dos dois passageiros e as regras de bagagem na companhia.</p><p class="small muted">Prévia para revisão. Nenhuma mensagem será enviada.</p>`,
        link("Voltar ao itinerário", "trip", "primary"),
        "trip",
      ),
      "trip-instructions",
    );
  if (name === "invite")
    return withModal(
      settings("team"),
      modal(
        "Convidar agente",
        `${field("E-mail do agente", "agente@example.com")}${field("Perfil", "Agente de vendas", "Acesso à própria carteira.", { select: true })}`,
        link("Cancelar", "team") + link("Simular convite", "team", "primary"),
        "team",
      ),
      "invite",
    );
  if (name === "privacy" || name === "terms")
    return shell(
      `${head(name === "privacy" ? "Política de Privacidade" : "Termos de Uso", "Documento existente no produto.")}${panel("Documento para revisão", `<p class="muted">A aplicação já possui esta página. A versão final deve reutilizar o texto vigente revisado pelo responsável, preservando o acesso pelo formulário público.</p><p class="small muted">Este protótipo não inventa condições jurídicas nem coleta dados.</p>${link("Voltar ao formulário", "public")}`)}`,
      "states",
      "",
      name,
    );
  if (name === "payables" || name === "sales")
    return shell(
      `${head(name === "sales" ? "Histórico de vendas" : "Contas a pagar", name === "sales" ? "Valores vendidos e suas parcelas." : "Custos e comissões previstos.")}${panel(name === "sales" ? "Venda V-0183 · Ana Martins" : "Custos da venda V-0183", `${kv(name === "sales" ? "Total vendido" : "Fornecedor", name === "sales" ? "R$ 8.460" : "R$ 7.610")}${kv(name === "sales" ? "Resultado previsto" : "Comissão", name === "sales" ? "R$ 600" : "R$ 250")}${link("Voltar a receber", "finance")}`)}`,
      "finance",
      "",
      name,
    );
  if (name === "settings-success")
    return withModal(
      settings("agency"),
      modal(
        "Preferências salvas",
        `<p>As preferências foram atualizadas neste cenário demonstrativo.</p>`,
        link("Voltar à agência", "agency", "primary"),
        "agency",
      ),
      name,
    );
  if (name === "finance-other")
    return withModal(
      finance(),
      modal(
        "Outras parcelas",
        `<p>O percurso financeiro detalhado usa a venda V-0183 de Ana Martins. Os outros registros demonstram a lista de vencimentos.</p>`,
        link("Voltar ao financeiro", "finance") +
          link("Abrir parcela de Ana", "receive", "primary"),
        "finance",
      ),
      name,
    );
  if (name === "detail-other")
    return withModal(
      quotes(),
      modal(
        "Outras cotações",
        `<p>O fluxo detalhado desta proposta usa Ana Martins como cenário principal. Os demais registros demonstram volume e variedade de etapas.</p>`,
        link("Voltar à lista", "quotes") +
          link("Abrir cenário de Ana", "detail", "primary"),
        "quotes",
      ),
      name,
    );
  return states();
}
Object.assign(screenNames, {
  "approved-list": "Cotações aprovadas",
  "new-client": "Nova pessoa",
  "edit-client": "Editar pessoa",
  "edit-trip": "Editar viagem",
  "trip-instructions": "Orientações de embarque",
  invite: "Convidar agente",
  privacy: "Privacidade",
  terms: "Termos",
  payables: "Contas a pagar",
  sales: "Histórico de vendas",
  "settings-success": "Preferências salvas",
  "detail-other": "Outros registros",
  menu: "Menu mobile",
  "finance-other": "Outras parcelas",
});
function render() {
  field.counter = 0;
  const params = new URLSearchParams(location.search);
  if (params.has("catalog")) {
    document.body.className = "catalog";
    $("#app").innerHTML =
      Object.keys(screenNames)
        .map(
          (k) =>
            `<div class="screen-name">${k} · ${screenNames[k]}</div>${renderScreen(k).replace(/data-screen="[^"]+"/, `data-screen="${k}"`)}`,
        )
        .join("") +
      `<div class="screen-name">Operação mobile</div>${home().replace('class="screen"', 'class="screen mobile-frame"').replace('data-screen="home"', 'data-screen="home-mobile"')}<div class="screen-name">Viagem mobile</div>${trip().replace('class="screen"', 'class="screen mobile-frame"').replace('data-screen="trip"', 'data-screen="trip-mobile"')}`;
    return;
  }
  document.body.className = "";
  const requested = location.hash.slice(1) || "home";
  $("#app").innerHTML =
    `<div class="demo"><span>PROTÓTIPO · Dados fictícios · Ações simuladas</span><a href="#states">Explorar telas e estados</a></div>${renderScreen(requested)}`;
  document.querySelector(".topbar .btn")?.classList.add("mobilemenu");
  document.title = (screenNames[requested] || "AgênciasHub") + " · Protótipo";
  const modalEl = document.querySelector('[role="dialog"]');
  if (modalEl) {
    modalEl.querySelector("a,button,input")?.focus();
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);
document.addEventListener("click", (e) => {
  const button = e.target.closest('[data-action="create"]');
  if (button) {
    const dest = [...document.querySelectorAll(".field")]
      .find((f) => f.querySelector("label")?.textContent === "Destino *")
      ?.querySelector("input");
    if (!dest?.value.trim()) {
      location.hash = "validation";
    } else location.hash = "created";
  }
});
document.addEventListener("input", (e) => {
  if (e.target.matches(".search")) {
    const query = e.target.value.toLocaleLowerCase("pt-BR");
    document
      .querySelectorAll("[data-search]")
      .forEach(
        (row) =>
          (row.style.display = row.dataset.search
            .toLocaleLowerCase("pt-BR")
            .includes(query)
            ? ""
            : "none"),
      );
  }
});
document.addEventListener("keydown", (e) => {
  const dialog = document.querySelector('[role="dialog"]');
  if (e.key === "Escape" && dialog) {
    const close = [...dialog.querySelectorAll("a")].find(
      (a) => a.textContent === "Fechar",
    );
    if (close) {
      e.preventDefault();
      location.hash = close.hash;
    }
  }
  if (e.key === "Tab" && dialog) {
    const items = [
      ...dialog.querySelectorAll(
        "a,button:not(:disabled),input,select,textarea",
      ),
    ];
    const first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
render();
