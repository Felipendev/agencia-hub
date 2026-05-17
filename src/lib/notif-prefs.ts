const STORAGE_KEY = "agencia-hub-notif-prefs";

export type NotifPrefs = {
  cotacaoVencendo: { enabled: boolean; diasAntecedencia: number };
  cotacaoVencida:  { enabled: boolean };
  submissaoNova:   { enabled: boolean };
  cotacaoAprovada: { enabled: boolean };
  clienteNovo:     { enabled: boolean };
  lancamentoConfirmado: { enabled: boolean };
};

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  cotacaoVencendo:     { enabled: true, diasAntecedencia: 3 },
  cotacaoVencida:      { enabled: true },
  submissaoNova:       { enabled: true },
  cotacaoAprovada:     { enabled: true },
  clienteNovo:         { enabled: false },
  lancamentoConfirmado:{ enabled: false },
};

export function loadNotifPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIF_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIF_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotifPrefs>;
    // deep merge with defaults so new keys are picked up
    return {
      cotacaoVencendo: {
        ...DEFAULT_NOTIF_PREFS.cotacaoVencendo,
        ...parsed.cotacaoVencendo,
      },
      cotacaoVencida:  { ...DEFAULT_NOTIF_PREFS.cotacaoVencida,  ...parsed.cotacaoVencida  },
      submissaoNova:   { ...DEFAULT_NOTIF_PREFS.submissaoNova,   ...parsed.submissaoNova   },
      cotacaoAprovada: { ...DEFAULT_NOTIF_PREFS.cotacaoAprovada, ...parsed.cotacaoAprovada },
      clienteNovo:     { ...DEFAULT_NOTIF_PREFS.clienteNovo,     ...parsed.clienteNovo     },
      lancamentoConfirmado: {
        ...DEFAULT_NOTIF_PREFS.lancamentoConfirmado,
        ...parsed.lancamentoConfirmado,
      },
    };
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

export function saveNotifPrefs(prefs: NotifPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
