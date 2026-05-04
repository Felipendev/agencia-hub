import { formatBRL, formatDateBR } from "@/lib/format";
import type { Cotacao, Cliente } from "@/types";

/**
 * Gera HTML formatado para impressão/PDF de uma cotação
 */
export function gerarHtmlCotacao(
  cotacao: Cotacao,
  cliente: Cliente,
  nomeAgencia: string = "AgenciaHub",
  logoUrl?: string
): string {
  const d = cotacao.detalhes;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotação - ${cotacao.titulo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0369a1;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0369a1;
    }
    
    .logo img {
      max-height: 60px;
      max-width: 200px;
    }
    
    .cotacao-info {
      text-align: right;
      font-size: 14px;
      color: #64748b;
    }
    
    .cotacao-numero {
      font-size: 12px;
      color: #94a3b8;
    }
    
    h1 {
      font-size: 32px;
      color: #0f172a;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #64748b;
      margin-bottom: 30px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #0369a1;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .info-item {
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
    }
    
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 15px;
      color: #0f172a;
      font-weight: 500;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      margin: 30px 0;
    }
    
    .valor-total {
      font-size: 14px;
      margin-bottom: 8px;
      opacity: 0.9;
    }
    
    .valor-numero {
      font-size: 42px;
      font-weight: bold;
    }
    
    .validade {
      font-size: 14px;
      margin-top: 12px;
      opacity: 0.9;
    }
    
    .servicos-list {
      list-style: none;
      padding: 0;
    }
    
    .servicos-list li {
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
    }
    
    .servicos-list li:last-child {
      border-bottom: none;
    }
    
    .servicos-list li:before {
      content: "✓";
      display: inline-block;
      width: 24px;
      height: 24px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      margin-right: 12px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .observacoes {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.8;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
    
    .footer-strong {
      font-weight: 600;
      color: #0369a1;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      ${logoUrl ? `<img src="${logoUrl}" alt="${nomeAgencia}">` : nomeAgencia}
    </div>
    <div class="cotacao-info">
      <div class="cotacao-numero">Cotação #${cotacao.id.slice(0, 8).toUpperCase()}</div>
      <div>${formatDateBR(cotacao.createdAt.slice(0, 10))}</div>
    </div>
  </div>

  <h1>${cotacao.titulo}</h1>
  <p class="subtitle">${cotacao.destino}</p>

  <div class="section">
    <div class="section-title">Informações do Cliente</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nome</div>
        <div class="info-value">${cliente.nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">E-mail</div>
        <div class="info-value">${cliente.email || "—"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Telefone</div>
        <div class="info-value">${cliente.telefone}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Destino de Interesse</div>
        <div class="info-value">${cliente.destinoInteresse}</div>
      </div>
    </div>
  </div>

  <div class="highlight-box">
    <div class="valor-total">Valor Total da Viagem</div>
    <div class="valor-numero">${formatBRL(cotacao.valorTotal)}</div>
    <div class="validade">Válido até ${formatDateBR(cotacao.validade)}</div>
  </div>

  <div class="section">
    <div class="section-title">Detalhes da Viagem</div>
    <div class="info-grid">
      ${d.origem ? `
      <div class="info-item">
        <div class="info-label">Origem</div>
        <div class="info-value">${d.origem}</div>
      </div>
      ` : ""}
      ${d.destinosTrechos?.some((t) => t.trim()) ? `
      <div class="info-item">
        <div class="info-label">Trechos</div>
        <div class="info-value">${d.destinosTrechos.filter((t) => t.trim()).join(" → ")}</div>
      </div>
      ` : ""}
      ${d.dataIda ? `
      <div class="info-item">
        <div class="info-label">Data de Ida</div>
        <div class="info-value">${formatDateBR(d.dataIda)}</div>
      </div>
      ` : ""}
      ${d.dataVolta ? `
      <div class="info-item">
        <div class="info-label">Data de Volta</div>
        <div class="info-value">${formatDateBR(d.dataVolta)}</div>
      </div>
      ` : ""}
      <div class="info-item">
        <div class="info-label">Passageiros</div>
        <div class="info-value">
          ${d.adultos || 0} adulto(s), ${d.criancas || 0} criança(s), ${d.bebes || 0} bebê(s)
        </div>
      </div>
      ${d.categoriaHospedagem ? `
      <div class="info-item">
        <div class="info-label">Hospedagem</div>
        <div class="info-value">${d.categoriaHospedagem}</div>
      </div>
      ` : ""}
    </div>
  </div>

  ${d.servicosDesejados?.length > 0 ? `
  <div class="section">
    <div class="section-title">Serviços Inclusos</div>
    <ul class="servicos-list">
      ${d.servicosDesejados.map((s) => {
        const labels: Record<string, string> = {
          passagem: "Passagens Aéreas",
          hospedagem: "Hospedagem",
          seguro: "Seguro Viagem",
          transfer: "Transfer Aeroporto",
          passeios: "Passeios e Ingressos",
          aluguel_carro: "Aluguel de Carro",
          chip: "Chip Internacional",
        };
        return `<li>${labels[s] || s}</li>`;
      }).join("")}
    </ul>
  </div>
  ` : ""}

  ${cotacao.observacoes ? `
  <div class="section">
    <div class="section-title">Observações Importantes</div>
    <div class="observacoes">
      ${cotacao.observacoes.replace(/\n/g, "<br>")}
    </div>
  </div>
  ` : ""}

  <div class="footer">
    <p><span class="footer-strong">${nomeAgencia}</span> - Realizando seus sonhos de viagem</p>
    <p>Esta cotação é válida até ${formatDateBR(cotacao.validade)}</p>
    <p>Entre em contato para mais informações ou para confirmar sua reserva</p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Abre janela de impressão com o HTML da cotação (gera PDF via Ctrl+P / Save as PDF)
 */
export function imprimirCotacao(
  cotacao: Cotacao,
  cliente: Cliente,
  nomeAgencia?: string,
  logoUrl?: string
): void {
  const html = gerarHtmlCotacao(cotacao, cliente, nomeAgencia, logoUrl);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup bloqueado. Permita popups para imprimir.");
  }

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

/**
 * Baixa a cotação como arquivo HTML (pode ser aberto no browser e salvo como PDF)
 */
export function baixarCotacaoHtml(
  cotacao: Cotacao,
  cliente: Cliente,
  nomeAgencia?: string,
  logoUrl?: string
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
    .replace(/[\u0300-\u036f]/g, "")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
