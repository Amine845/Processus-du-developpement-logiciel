export type LatestOutcome<T> = { stale: true } | { stale: false; value: T }

/**
 * Garantit qu'une seule requête, la plus récente, peut produire un résultat.
 * Lancer une nouvelle requête annule la précédente (AbortSignal) et rend sa
 * réponse « périmée », même si elle arrive après coup.
 */
export function createLatestRequest() {
  let current = 0
  let controller: AbortController | null = null

  return {
    async run<T>(
      task: (signal: AbortSignal) => Promise<T>,
    ): Promise<LatestOutcome<T>> {
      controller?.abort()
      const id = ++current
      const own = new AbortController()
      controller = own
      try {
        const value = await task(own.signal)
        return id === current ? { stale: false, value } : { stale: true }
      } catch (error) {
        // Une erreur d'une requête dépassée (dont l'annulation) est sans intérêt.
        if (id !== current) return { stale: true }
        throw error
      }
    },

    /** Invalide toute requête en cours (démontage, requête devenue trop courte). */
    cancel() {
      current++
      controller?.abort()
      controller = null
    },
  }
}
