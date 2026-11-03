import { useEffect, useState } from 'react'
import type { CiqualFoodDetailDTO } from '../../../shared/types/ciqual.types'
import { ciqualApi } from '../../api/ciqual.api'
import { formatNutrient } from './format-nutrient'

/** Énergie, protéines, glucides, lipides : affichés d'emblée. */
const CORE_KEYS = ['328', '25003', '31000', '40000']

interface Loaded {
  code: string
  detail?: CiqualFoodDetailDTO
  failed?: boolean
}

export default function CiqualNutrientPreview({ code }: { code: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    ciqualApi.getByCode(code, { signal: controller.signal }).then(
      (detail) => {
        if (!controller.signal.aborted) setLoaded({ code, detail })
      },
      () => {
        if (!controller.signal.aborted) setLoaded({ code, failed: true })
      },
    )
    return () => controller.abort()
  }, [code, attempt])

  const current = loaded?.code === code ? loaded : null

  if (!current) {
    return (
      <p className="ciqual-preview__status" role="status">
        Chargement des valeurs nutritionnelles…
      </p>
    )
  }
  if (current.failed || !current.detail) {
    return (
      <p className="ciqual-preview__status" role="alert">
        Valeurs nutritionnelles indisponibles.{' '}
        <button
          type="button"
          className="ciqual-preview__link"
          onClick={() => {
            setLoaded(null)
            setAttempt((n) => n + 1)
          }}
        >
          Réessayer
        </button>
      </p>
    )
  }

  const { detail } = current
  const core = CORE_KEYS.flatMap((key) =>
    detail.nutrients.filter((n) => n.key === key),
  )
  const others = detail.nutrients.filter((n) => !CORE_KEYS.includes(n.key))

  return (
    <section
      className="ciqual-preview"
      aria-label={`Valeurs nutritionnelles de ${detail.name}`}
    >
      <p className="ciqual-preview__meta">
        Pour {detail.baseQuantity} {detail.baseUnit} d'aliment. Ciqual, code{' '}
        {detail.code}, version {detail.version}.
        {!detail.active &&
          ' Cet aliment ne figure plus dans la publication courante.'}
      </p>
      <dl className="ciqual-preview__list">
        {core.map((n) => (
          <div key={n.key} className="ciqual-preview__row">
            <dt>{n.label ?? n.key}</dt>
            <dd>{formatNutrient(n)}</dd>
          </div>
        ))}
      </dl>
      {others.length > 0 && (
        <details className="ciqual-preview__more">
          <summary>Autres constituants ({others.length})</summary>
          <dl className="ciqual-preview__list">
            {others.map((n) => (
              <div key={n.key} className="ciqual-preview__row">
                <dt>{n.label ?? n.key}</dt>
                <dd>{formatNutrient(n)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <p className="ciqual-preview__meta">{detail.attribution}</p>
    </section>
  )
}
