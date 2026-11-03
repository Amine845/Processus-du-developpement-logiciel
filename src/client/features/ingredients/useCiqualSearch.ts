import { useEffect, useState } from 'react'
import { CIQUAL_SEARCH_MIN_LENGTH } from '../../../shared/types/ciqual.types'
import { ciqualApi } from '../../api/ciqual.api'
import { createLatestRequest } from './latest-request'
import {
  cleanQuery,
  deriveSearchView,
  type SearchView,
  type SettledSearch,
} from './search-view'

interface Options {
  debounceMs?: number
  limit?: number
}

/** Recherche CIQUAL avec délai de saisie, annulation et protection contre les réponses tardives. */
export function useCiqualSearch(
  text: string,
  { debounceMs = 250, limit }: Options = {},
): { view: SearchView; retry: () => void } {
  const query = cleanQuery(text)
  const [latest] = useState(createLatestRequest)
  const [settled, setSettled] = useState<SettledSearch | null>(null)
  const [attempt, setAttempt] = useState(0)
  const searchable = [...query].length >= CIQUAL_SEARCH_MIN_LENGTH

  useEffect(() => {
    if (!searchable) return
    const timer = setTimeout(() => {
      latest
        .run((signal) => ciqualApi.search(query, { signal, limit }))
        .then(
          (outcome) => {
            if (!outcome.stale) setSettled({ query, response: outcome.value })
          },
          () => setSettled({ query, failed: true }),
        )
    }, debounceMs)
    return () => {
      clearTimeout(timer)
      latest.cancel()
    }
  }, [latest, query, searchable, limit, debounceMs, attempt])

  return {
    view: deriveSearchView(text, settled, CIQUAL_SEARCH_MIN_LENGTH),
    retry: () => {
      setSettled(null)
      setAttempt((n) => n + 1)
    },
  }
}
