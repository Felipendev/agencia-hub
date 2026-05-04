const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;

export function isValidSolicitacaoSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}
