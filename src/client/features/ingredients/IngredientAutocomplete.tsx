import {
  CIQUAL_CATEGORY_LABELS,
  type CiqualCategoryFilter,
} from '../../../shared/types/ciqual.types'
import { useEffect, useId, useRef, useState } from 'react'
import type {
  CiqualFoodSummaryDTO,
  IngredientSelection,
} from '../../../shared/types/ciqual.types'
import CiqualNutrientPreview from './CiqualNutrientPreview'
import { cleanQuery } from './search-view'
import { useCiqualSearch } from './useCiqualSearch'
import './IngredientAutocomplete.css'

interface Props {
  label: string
  value: IngredientSelection | null
  onChange: (selection: IngredientSelection | null) => void
  disabled?: boolean
}

type Option =
  | { kind: 'food'; food: CiqualFoodSummaryDTO }
  | { kind: 'manual'; name: string }

const MESSAGES = {
  idle: 'Saisissez le nom d’un aliment.',
  loading: 'Recherche en cours…',
  empty:
    'Aucun aliment Ciqual trouvé. Vous pouvez saisir un ingrédient manuel.',
  error:
    'La recherche a échoué. Vous pouvez réessayer ou saisir un ingrédient manuel.',
} as const

export default function IngredientAutocomplete({
  label,
  value,
  onChange,
  disabled = false,
}: Props) {
  const baseId = useId()
  const inputId = `${baseId}-input`
  const listId = `${baseId}-list`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const [text, setText] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  const [category, setCategory] = useState<CiqualCategoryFilter>('food')
  const { view, retry } = useCiqualSearch(text, { category })
  const manualName = cleanQuery(text)

  const options: Option[] = [
    ...(view.kind === 'results'
      ? view.response.results.map((food): Option => ({ kind: 'food', food }))
      : []),
    ...(manualName ? [{ kind: 'manual', name: manualName } as Option] : []),
  ]
  const activeIndex = active < options.length ? active : -1

  useEffect(() => {
    if (activeIndex < 0) return
    listRef.current?.children[activeIndex]?.scrollIntoView?.({
      block: 'nearest',
    })
  }, [activeIndex])

  const statusMessage =
    view.kind === 'short'
      ? `Saisissez au moins ${view.minLength} caractères pour chercher dans Ciqual.`
      : view.kind === 'results'
        ? `${view.response.results.length} aliment${view.response.results.length > 1 ? 's' : ''}${view.response.truncated ? ', précisez votre recherche pour en voir d’autres' : ''}.`
        : MESSAGES[view.kind]

  function choose(option: Option) {
    if (option.kind === 'food') {
      const { code, name, source, version } = option.food
      setText(name)
      onChange({ mode: 'ciqual', code, name, source, version })
    } else {
      setText(option.name)
      onChange({ mode: 'manual', name: option.name })
    }
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) setOpen(true)
        if (options.length > 0) setActive((activeIndex + 1) % options.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) setOpen(true)
        if (options.length > 0) {
          setActive(activeIndex <= 0 ? options.length - 1 : activeIndex - 1)
        }
        break
      case 'Enter':
        // Entrée ne valide que l'option explicitement ciblée ; jamais d'envoi de formulaire par erreur.
        if (open && activeIndex >= 0) {
          event.preventDefault()
          choose(options[activeIndex])
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          setOpen(false)
          setActive(-1)
        }
        break
    }
  }

  const showPopup = open && !disabled && manualName.length > 0

  return (
    <div
      className="ingredient-autocomplete"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          setActive(-1)
        }
      }}
    >
      <label className="ingredient-autocomplete__label" htmlFor={inputId}>
        {label}
      </label>
      <label htmlFor={`${baseId}-category`}>Catégorie CIQUAL</label>
      <select
        id={`${baseId}-category`}
        value={category}
        disabled={disabled}
        onChange={(event) => {
          setCategory(event.target.value as CiqualCategoryFilter)
          setActive(-1)
          setOpen(true)
        }}
      >
        {Object.entries(CIQUAL_CATEGORY_LABELS).map(([key, title]) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
        <option value="all">Toutes les catégories (y compris À classer)</option>
      </select>
      <input
        id={inputId}
        className="ingredient-autocomplete__input"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPopup}
        aria-controls={listId}
        aria-activedescendant={
          showPopup && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        disabled={disabled}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setOpen(true)
          setActive(-1)
          // Modifier le texte invalide le choix précédent : aucune identité périmée n'est conservée.
          if (value !== null) onChange(null)
        }}
        onFocus={() => {
          if (value === null) setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />

      {showPopup && (
        <div className="ingredient-autocomplete__popup">
          <p
            className="ingredient-autocomplete__status"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
            {view.kind === 'error' && (
              <>
                {' '}
                <button
                  type="button"
                  className="ingredient-autocomplete__link"
                  onClick={retry}
                >
                  Réessayer
                </button>
              </>
            )}
          </p>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Suggestions d’ingrédients"
            className="ingredient-autocomplete__list"
          >
            {options.map((option, index) => (
              <li
                key={option.kind === 'food' ? option.food.code : 'manual'}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={`ingredient-autocomplete__option${
                  option.kind === 'manual'
                    ? ' ingredient-autocomplete__option--manual'
                    : ''
                }`}
                // Garde le focus dans le champ : le clic (ou le toucher) sélectionne sans blur préalable.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                {option.kind === 'food' ? (
                  <>
                    <span className="ingredient-autocomplete__name">
                      {option.food.name}
                    </span>
                    <span className="ingredient-autocomplete__meta">
                      Ciqual, code {option.food.code} ·{' '}
                      {CIQUAL_CATEGORY_LABELS[option.food.category]}
                      {' · '}
                      {option.food.detailGroupName &&
                      option.food.detailGroupName !== '-'
                        ? option.food.detailGroupName
                        : option.food.subgroupName ||
                          option.food.groupName ||
                          'Groupe non renseigné'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="ingredient-autocomplete__name">
                      Utiliser « {option.name} » comme ingrédient manuel
                    </span>
                    <span className="ingredient-autocomplete__meta">
                      Sans code ni données nutritionnelles
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {value?.mode === 'ciqual' && <CiqualNutrientPreview code={value.code} />}
      {value?.mode === 'manual' && (
        <p className="ciqual-preview__status">
          Ingrédient manuel : aucune donnée nutritionnelle associée.
        </p>
      )}
    </div>
  )
}
