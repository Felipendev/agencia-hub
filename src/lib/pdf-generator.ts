import { formatBRL, formatDateBR } from "@/lib/format";
import type { Cotacao, Cliente } from "@/types";

// ── label helpers (inline to keep this file self-contained) ──────────────────

const SERVICOS_LABELS: Record<string, string> = {
  passagem: "Passagem aérea",
  hospedagem: "Hospedagem",
  transfer: "Transfer aeroporto ↔ hospedagem",
  carro: "Aluguel de carro",
  passeios: "Passeios / ingressos",
  seguro: "Seguro viagem",
  visto: "Visto",
  passaporte: "Passaporte",
  cruzeiro: "Cruzeiro",
  excursao: "Excursão / intercâmbio",
  onibus: "Ônibus",
};

const FLEX_LABELS: Record<string, string> = {
  um_dia_antes: "Sim (1 dia antes)",
  um_dia_depois: "Sim (1 dia depois)",
  exato: "Não (data exata)",
  outro: "Outro",
};

const HORARIO_LABELS: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  madrugada: "Madrugada",
  mais_barato: "O mais barato",
};

const VOO_LABELS: Record<string, string> = {
  direto: "Somente voo direto",
  escalas: "Pode ter escalas",
  barato: "A opção mais barata",
};

const HOSPEDAGEM_LABELS: Record<string, string> = {
  economico: "Econômico (hostel)",
  basico: "Local só para dormir",
  "4estrelas": "Hotel 4 estrelas + café",
  "5estrelas": "Hotel 5 estrelas",
  resort: "Resort",
};

const PAGAMENTO_LABELS: Record<string, string> = {
  pix: "À vista / Pix",
  cartao: "Cartão de crédito",
  debito: "Cartão de débito",
  boleto: "Boleto bancário",
  outro: "Outro",
};

const COMUNICACAO_LABELS: Record<string, string> = {
  wa_texto: "WhatsApp (texto)",
  wa_audio: "WhatsApp (áudio)",
  wa_video: "WhatsApp (vídeo)",
  wa_voz: "WhatsApp (ligação)",
  email: "E-mail",
};

function lbl(map: Record<string, string>, id: string): string {
  return map[id] ?? id;
}

function row(label: string, value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return `
    <div class="info-item">
      <div class="info-label">${label}</div>
      <div class="info-value">${value}</div>
    </div>`;
}

function section(title: string, color: string, content: string): string {
  if (!content.trim()) return "";
  return `
  <div class="section">
    <div class="section-title" style="border-color:${color};color:${color}">${title}</div>
    <div class="info-grid">${content}</div>
  </div>`;
}

export function gerarHtmlCotacao(
  cotacao: Cotacao,
  cliente: Cliente,
  nomeAgencia: string = "Agência",
  logoUrl?: string,
): string {
  const d = cotacao.detalhes;

  // ── Roteiro ──
  const trechos = d.destinosTrechos.filter((x) => x.trim()).join(" → ") || d.destinoForm || "";
  const roteiro = [d.origem, trechos].filter(Boolean).join(" → ");

  // ── Passageiros ──
  const paxParts = [`${d.adultos} adulto${d.adultos !== 1 ? "s" : ""}`];
  if (d.criancas > 0) paxParts.push(`${d.criancas} criança${d.criancas !== 1 ? "s" : ""}${d.idadesCriancas ? ` (${d.idadesCriancas})` : ""}`);
  if (d.bebes > 0) paxParts.push(`${d.bebes} bebê${d.bebes !== 1 ? "s" : ""}`);

  // ── Flexibilidade ──
  const flexIda = d.flexibilidadeIda ? lbl(FLEX_LABELS, d.flexibilidadeIda) + (d.flexibilidadeIda === "outro" && d.flexibilidadeIdaOutro ? `: ${d.flexibilidadeIdaOutro}` : "") : "";
  const flexVolta = d.flexibilidadeVolta ? lbl(FLEX_LABELS, d.flexibilidadeVolta) + (d.flexibilidadeVolta === "outro" && d.flexibilidadeVoltaOutro ? `: ${d.flexibilidadeVoltaOutro}` : "") : "";

  // ── Bagagem ──
  const bagagem = d.malasDespachadas
    ? `${d.qtdMalas ? d.qtdMalas + " " : ""}mala${d.qtdMalas === "1" ? "" : "s"} despachada${d.qtdMalas === "1" ? "" : "s"}${d.bagagemEspecial ? " + bagagem especial" : ""}`
    : d.bagagemEspecial ? "Somente bagagem especial" : "Sem bagagem despachada";

  // ── Pagamento ──
  const pagamento = d.formaPagamento === "outro" && d.formaPagamentoOutro
    ? d.formaPagamentoOutro
    : d.formaPagamento ? lbl(PAGAMENTO_LABELS, d.formaPagamento) : "";

  // ── WhatsApp ──
  const whatsapp = d.whatsappIgualCelular ? d.celular : d.whatsapp;

  // ── Hospedagem ──
  const hospedagemStr = [
    d.categoriaHospedagem ? lbl(HOSPEDAGEM_LABELS, d.categoriaHospedagem) : "",
    d.qtdQuartos > 0 ? `${d.qtdQuartos} quarto${d.qtdQuartos !== 1 ? "s" : ""}` : "",
    d.comodidadesHospedagem.length > 0 ? d.comodidadesHospedagem.join(", ") : "",
  ].filter(Boolean).join(" · ");

  // ── Voo ──
  const vooParts = [
    d.horarioSaidaIda ? `Ida: ${lbl(HORARIO_LABELS, d.horarioSaidaIda)}` : "",
    d.horarioSaidaVolta ? `Volta: ${lbl(HORARIO_LABELS, d.horarioSaidaVolta)}` : "",
    d.preferenciaVooIda ? lbl(VOO_LABELS, d.preferenciaVooIda) : "",
    d.usaMilhas ? "Usa milhas" : "",
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotação — ${cotacao.titulo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.55;
      color: #1e293b;
      background: #f8fafc;
    }

    .page {
      max-width: 820px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 40px rgba(0,0,0,0.08);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: white;
      padding: 28px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-area { display: flex; align-items: center; gap: 14px; }
    .logo img { max-height: 52px; max-width: 160px; object-fit: contain; }
    .logo-text { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .logo-sub { font-size: 11px; opacity: 0.6; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }

    .header-meta { text-align: right; font-size: 12px; opacity: 0.75; }
    .header-meta .num { font-size: 14px; font-weight: 600; opacity: 1; margin-bottom: 4px; }

    /* ── Hero ── */
    .hero {
      padding: 28px 36px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .hero h1 {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }

    .hero .destino {
      font-size: 15px;
      color: #64748b;
      margin-top: 4px;
    }

    /* ── Valor box ── */
    .valor-box {
      margin: 20px 0;
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 60%, #38bdf8 100%);
      border-radius: 12px;
      padding: 20px 28px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .valor-box .valor-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; margin-bottom: 6px; }
    .valor-box .valor-num { font-size: 38px; font-weight: 800; letter-spacing: -1px; }
    .valor-box .valor-validade { font-size: 12px; opacity: 0.85; margin-top: 6px; }

    .valor-box .pax-box { text-align: right; }
    .valor-box .pax-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; margin-bottom: 4px; }
    .valor-box .pax-num { font-size: 20px; font-weight: 700; }

    /* ── Client card ── */
    .client-card {
      margin: 0 36px 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .client-card .cl { }
    .client-card .cl-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 3px; }
    .client-card .cl-val { font-size: 14px; font-weight: 600; color: #0f172a; }

    /* ── Sections ── */
    .body { padding: 0 36px 8px; }

    .section { margin-bottom: 22px; }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      padding-bottom: 8px;
      border-bottom-width: 2px;
      border-bottom-style: solid;
      margin-bottom: 14px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }

    .info-item {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      padding: 10px 14px;
    }

    .info-item.wide { grid-column: 1 / -1; }

    .info-label {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 3px;
    }

    .info-value {
      font-size: 13.5px;
      color: #1e293b;
      font-weight: 500;
    }

    /* ── Serviços ── */
    .services-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .service-tag {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 20px;
      padding: 5px 14px;
      font-size: 12.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .service-tag::before {
      content: "✓";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      font-size: 9px;
      font-weight: 800;
      flex-shrink: 0;
    }

    /* ── Opções de voo ── */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { border-bottom: 2px solid #e2e8f0; }
    th { padding: 9px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; }
    td { padding: 9px 8px; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    td.right, th.right { text-align: right; }
    td.bold { font-weight: 700; }

    /* ── Observações ── */
    .obs-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      font-size: 13.5px;
      line-height: 1.7;
      color: #78350f;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 18px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }

    .footer strong { color: #0f172a; font-weight: 600; }

    .badge-sim {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      border-radius: 20px;
      padding: 1px 10px;
      font-size: 11.5px;
      font-weight: 600;
    }

    .badge-nao {
      display: inline-block;
      background: #f1f5f9;
      color: #94a3b8;
      border-radius: 20px;
      padding: 1px 10px;
      font-size: 11.5px;
      font-weight: 500;
    }

    .cupom {
      display: inline-block;
      background: #d1fae5;
      color: #064e3b;
      border: 1px dashed #34d399;
      border-radius: 6px;
      padding: 2px 10px;
      font-size: 13px;
      font-weight: 700;
      font-family: monospace;
      letter-spacing: 1px;
    }

    @media print {
      body { background: white; }
      .page { box-shadow: none; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      ${logoUrl
        ? `<div class="logo"><img src="${logoUrl}" alt="${nomeAgencia}"></div>`
        : `<div class="logo-text">${nomeAgencia}</div>`}
    </div>
    <div class="header-meta">
      <div class="num">Cotação #${cotacao.id.slice(0, 8).toUpperCase()}</div>
      <div>${formatDateBR(cotacao.createdAt.slice(0, 10))}</div>
      <div>Resp.: ${cotacao.responsavel}</div>
    </div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <h1>${cotacao.titulo}</h1>
    ${cotacao.destino ? `<div class="destino">✈ ${cotacao.destino}</div>` : ""}

    <!-- Valor -->
    <div class="valor-box">
      <div>
        <div class="valor-label">Valor total da viagem</div>
        <div class="valor-num">${cotacao.valorTotal > 0 ? formatBRL(cotacao.valorTotal) : "A definir"}</div>
        <div class="valor-validade">Proposta válida até ${formatDateBR(cotacao.validade)}</div>
      </div>
      <div class="pax-box">
        <div class="pax-label">Passageiros</div>
        <div class="pax-num">${d.adultos + d.criancas + d.bebes}</div>
        <div style="font-size:11px;opacity:0.8;margin-top:2px">${paxParts.join(" + ")}</div>
      </div>
    </div>
  </div>

  <!-- Cliente -->
  <div class="client-card">
    <div class="cl">
      <div class="cl-label">Cliente</div>
      <div class="cl-val">${cliente.nome}</div>
    </div>
    ${cliente.email ? `<div class="cl"><div class="cl-label">E-mail</div><div class="cl-val">${cliente.email}</div></div>` : ""}
    ${(d.celular || cliente.telefone) ? `<div class="cl"><div class="cl-label">Celular</div><div class="cl-val">${d.celular || cliente.telefone}</div></div>` : ""}
    ${(d.whatsappIgualCelular ? d.celular : d.whatsapp) ? `<div class="cl"><div class="cl-label">WhatsApp</div><div class="cl-val">${d.whatsappIgualCelular ? d.celular : d.whatsapp}</div></div>` : ""}
  </div>

  <div class="body">

    ${section("✈ Roteiro e datas", "#0369a1", `
      ${row("Origem", d.origem)}
      ${row("Destinos", trechos)}
      ${d.dataIda ? row("Data de ida", formatDateBR(d.dataIda)) : ""}
      ${d.dataVolta ? row("Data de volta", formatDateBR(d.dataVolta)) : ""}
      ${flexIda ? row("Flexibilidade ida", flexIda) : ""}
      ${flexVolta ? row("Flexibilidade volta", flexVolta) : ""}
      ${cotacao.dataInicioViagem ? row("Início viagem", formatDateBR(cotacao.dataInicioViagem)) : ""}
      ${cotacao.dataFimViagem ? row("Fim viagem", formatDateBR(cotacao.dataFimViagem)) : ""}
    `)}

    ${vooParts.length > 0 ? section("🛫 Preferências de voo", "#7c3aed", `
      ${d.horarioSaidaIda ? row("Horário saída (ida)", lbl(HORARIO_LABELS, d.horarioSaidaIda)) : ""}
      ${d.horarioSaidaVolta ? row("Horário saída (volta)", lbl(HORARIO_LABELS, d.horarioSaidaVolta)) : ""}
      ${d.preferenciaVooIda ? row("Preferência (ida)", lbl(VOO_LABELS, d.preferenciaVooIda)) : ""}
      ${d.preferenciaVooVolta ? row("Preferência (volta)", lbl(VOO_LABELS, d.preferenciaVooVolta)) : ""}
      <div class="info-item"><div class="info-label">Uso de milhas</div><div class="info-value">${d.usaMilhas ? '<span class="badge-sim">Sim</span>' : '<span class="badge-nao">Não</span>'}</div></div>
    `) : ""}

    ${(d.malasDespachadas || d.bagagemEspecial || d.idadesCriancas) ? section("🧳 Bagagem e passageiros", "#0f766e", `
      ${row("Passageiros", paxParts.join(", "))}
      ${d.idadesCriancas ? row("Idades das crianças", d.idadesCriancas) : ""}
      <div class="info-item"><div class="info-label">Malas despachadas</div><div class="info-value">${d.malasDespachadas ? `<span class="badge-sim">${d.qtdMalas ? d.qtdMalas + " mala(s)" : "Sim"}</span>` : '<span class="badge-nao">Não</span>'}</div></div>
      <div class="info-item"><div class="info-label">Bagagem especial</div><div class="info-value">${d.bagagemEspecial ? '<span class="badge-sim">Sim</span>' : '<span class="badge-nao">Não</span>'}</div></div>
    `) : ""}

    ${hospedagemStr ? section("🏨 Hospedagem", "#b45309", `
      ${d.categoriaHospedagem ? row("Categoria", lbl(HOSPEDAGEM_LABELS, d.categoriaHospedagem)) : ""}
      ${d.qtdQuartos > 0 ? row("Quartos", String(d.qtdQuartos)) : ""}
      ${d.comodidadesHospedagem.length > 0 ? `<div class="info-item wide"><div class="info-label">Comodidades</div><div class="info-value">${d.comodidadesHospedagem.join(" · ")}</div></div>` : ""}
    `) : ""}

    ${d.servicosDesejados.length > 0 ? `
    <div class="section">
      <div class="section-title" style="border-color:#16a34a;color:#16a34a">✓ Serviços solicitados</div>
      <div class="services-grid">
        ${d.servicosDesejados.map((s) => `<div class="service-tag">${lbl(SERVICOS_LABELS, s)}</div>`).join("")}
      </div>
    </div>` : ""}

    ${(pagamento || d.usaMilhas || d.cupomCodigo.trim() || d.preferenciaComunicacao) ? section("💳 Pagamento e contato", "#be185d", `
      ${pagamento ? row("Forma de pagamento", pagamento) : ""}
      ${d.preferenciaComunicacao ? row("Preferência de contato", lbl(COMUNICACAO_LABELS, d.preferenciaComunicacao)) : ""}
      ${d.cupomCodigo.trim() ? `<div class="info-item"><div class="info-label">Cupom de desconto</div><div class="info-value"><span class="cupom">${d.cupomCodigo}</span>${d.cupomValidoAte ? `<span style="font-size:11px;color:#64748b;margin-left:8px">válido até ${formatDateBR(d.cupomValidoAte)}</span>` : ""}</div></div>` : ""}
    `) : ""}

    ${cotacao.opcoesVoo && cotacao.opcoesVoo.length > 0 ? `
    <div class="section">
      <div class="section-title" style="border-color:#0369a1;color:#0369a1">✈ Opções de voo</div>
      <table>
        <thead>
          <tr>
            <th>Companhia / voo</th>
            <th>Horário</th>
            <th>Conexões</th>
            <th class="right">Passagens</th>
            ${cotacao.opcoesVoo.some((o) => o.precoBagagens > 0) ? "<th class='right'>Bagagens</th>" : ""}
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${cotacao.opcoesVoo.map((o) => `
          <tr>
            <td><strong style="color:${o.corCia || "#0369a1"}">${o.cia}</strong><br><span style="font-size:11px;color:#64748b">${o.nome}</span></td>
            <td>${o.horarioSaida}${o.horarioChegada ? " → " + o.horarioChegada : ""}</td>
            <td>${o.conexoes || "Direto"}</td>
            <td class="right">${formatBRL(o.precoPassagens)}</td>
            ${cotacao.opcoesVoo!.some((x) => x.precoBagagens > 0) ? `<td class="right">${o.precoBagagens > 0 ? formatBRL(o.precoBagagens) : "—"}</td>` : ""}
            <td class="right bold">${formatBRL(o.precoTotal)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <p style="margin-top:10px;font-size:11px;color:#64748b">Valores para ${cotacao.opcoesVoo[0].qtdPessoas} passageiro${cotacao.opcoesVoo[0].qtdPessoas > 1 ? "s" : ""}.</p>
    </div>` : ""}

    ${cotacao.observacoes ? `
    <div class="section">
      <div class="section-title" style="border-color:#d97706;color:#d97706">📝 Observações</div>
      <div class="obs-box">${cotacao.observacoes.replace(/\n/g, "<br>")}</div>
    </div>` : ""}

  </div><!-- /body -->

  <!-- Footer -->
  <div class="footer">
    <div>
      <strong>${nomeAgencia}</strong> — realizando seus sonhos de viagem
    </div>
    <div>
      Proposta válida até <strong>${formatDateBR(cotacao.validade)}</strong>
    </div>
  </div>

</div><!-- /page -->
</body>
</html>`;

  return html;
}

export function imprimirCotacao(
  cotacao: Cotacao,
  cliente: Cliente,
  nomeAgencia?: string,
  logoUrl?: string,
): void {
  const html = gerarHtmlCotacao(cotacao, cliente, nomeAgencia, logoUrl);
  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Popup bloqueado. Permita popups para imprimir.");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };
}

export function baixarCotacaoHtml(
  cotacao: Cotacao,
  cliente: Cliente,
  nomeAgencia?: string,
  logoUrl?: string,
): void {
  const html = gerarHtmlCotacao(cotacao, cliente, nomeAgencia, logoUrl);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cotacao-${cotacao.id.slice(0, 8)}-${cliente.nome
    .replace(/\s+/g, "-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
