import type { CiqualSearchResponseDTO } from '../../../shared/types/ciqual.types'

/** Dernier résultat connu, rattaché à la requête qui l'a produit. */
export interface SettledSearch {
  query: string
  response?: CiqualSearchResponseDTO
  failed?: boolean
}

export type SearchView =
  | { kind: 'idle' }
  | { kind: 'short'; minLength: number }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'results'; response: CiqualSearchResponseDTO }

export function cleanQuery(text: string): string {
  return text.replace(/\s+/gu, ' ').trim()
}

/**
 * État affiché, déduit de la saisie et du dernier résultat réglé.
 * Un résultat n'est montré que s'il correspond exactement à la saisie courante :
 * c'est ce qui empêche une ancienne réponse de s'afficher pour une requête récente.
 */
export function deriveSearchView(
  text: string,
  settled: SettledSearch | null,
  minLength: number,
): SearchView {
  const query = cleanQuery(text)
  if (query.length === 0) return { kind: 'idle' }
  if ([...query].length < minLength) return { kind: 'short', minLength }
  if (!settled || settled.query !== query) return { kind: 'loading' }
  if (settled.failed || !settled.response) return { kind: 'error' }
  return settled.response.results.length === 0
    ? { kind: 'empty' }
    : { kind: 'results', response: settled.response }
}
