import type { TagDTO } from '../../shared/types/tag.types'
import type { EquipmentDTO } from '../../shared/types/equipment.types'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IngredientAutocomplete from '../features/ingredients/IngredientAutocomplete'
import {
  recipePayload,
  type IngredientDraft,
} from '../features/recipes/recipe-form'
import { RECIPE_UNITS, type RecipeUnit } from '../../shared/types/recipe.types'
import { recipesApi } from '../api/recipes.api'
import './recipe-editor.css'

export default function RecipeCreatePage() {
  const navigate = useNavigate()
  const nextId = useRef(2)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState('1')
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { id: 1, selection: null, quantity: '', unit: 'g' },
  ])
  const [steps, setSteps] = useState([{ id: 1, instruction: '' }])

  const [tagIds, setTagIds] = useState<number[]>([])
  const [equipmentIds, setEquipmentIds] = useState<number[]>([])
  const [catalogs, setCatalogs] = useState<{
    tags: TagDTO[]
    equipment: EquipmentDTO[]
  } | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  useEffect(() => {
    let active = true
    Promise.all([recipesApi.getTags(), recipesApi.getEquipment()]).then(
      ([tags, equipment]) => {
        if (active) {
          setCatalogs({ tags, equipment })
          setCatalogError(false)
        }
      },
      () => {
        if (active) setCatalogError(true)
      },
    )
    return () => {
      active = false
    }
  }, [catalogAttempt])
  const toggleId = (ids: number[], id: number) =>
    ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)

  function changeLine(id: number, patch: Partial<IngredientDraft>) {
    setIngredients((lines) =>
      lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    )
  }

  function moveStep(index: number, offset: number) {
    setSteps((current) => {
      const result = [...current]
      ;[result[index], result[index + offset]] = [
        result[index + offset],
        result[index],
      ]
      return result
    })
  }

  return (
    <form
      className="recipe-editor"
      onSubmit={async (event) => {
        event.preventDefault()
        if (submitting.current) return
        setError('')
        try {
          const payload = recipePayload({
            title,
            description,
            servings,
            ingredients,
            steps,
            tagIds,
            equipmentIds,
          })

          submitting.current = true
          setSaving(true)
          const recipe = await recipesApi.create(payload)
          navigate(`/recipes/${recipe.id}`)
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Impossible d’enregistrer la recette.',
          )
        } finally {
          submitting.current = false
          setSaving(false)
        }
      }}
    >
      <h2>Nouvelle recette</h2>
      <fieldset disabled={saving}>
        <label>
          Titre
          <input
            value={title}
            maxLength={200}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Description (facultative)
          <textarea
            value={description}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Portions
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            required
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </label>

        {catalogError ? (
          <p role="alert">
            Impossible de charger les tags et équipements.{' '}
            <button
              type="button"
              onClick={() => setCatalogAttempt((value) => value + 1)}
            >
              Réessayer le chargement
            </button>
          </p>
        ) : catalogs === null ? (
          <p role="status">Chargement des tags et équipements…</p>
        ) : null}
        {/* SELECTION TAGS BDD */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>
            Tags de la recette
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {catalogs && catalogs.tags.length === 0 && (
              <p>Aucun tag disponible.</p>
            )}
            {(catalogs?.tags ?? []).map((tag) => {
              const active = tagIds.includes(tag.id)
              return (
                <label
                  className="recipe-choice"
                  key={tag.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: active
                      ? 'var(--color-accent)'
                      : 'var(--color-border)',
                    background: active
                      ? 'var(--color-accent)'
                      : 'var(--color-surface)',
                    color: active ? 'white' : 'inherit',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: 1,
                      height: 1,
                      minHeight: 0,
                      padding: 0,
                    }}
                    checked={active}
                    onChange={() => setTagIds((ids) => toggleId(ids, tag.id))}
                  />
                  <span>{tag.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* SELECTION EQUIPEMENT BDD */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>
            Matériel requis
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {catalogs && catalogs.equipment.length === 0 && (
              <p>Aucun équipement disponible.</p>
            )}
            {(catalogs?.equipment ?? []).map((eq) => {
              const active = equipmentIds.includes(eq.id)
              return (
                <label
                  className="recipe-choice"
                  key={eq.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: active
                      ? 'var(--color-text)'
                      : 'var(--color-border)',
                    background: active
                      ? 'var(--color-text)'
                      : 'var(--color-surface)',
                    color: active ? 'var(--color-surface)' : 'inherit',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: 1,
                      height: 1,
                      minHeight: 0,
                      padding: 0,
                    }}
                    checked={active}
                    onChange={() =>
                      setEquipmentIds((ids) => toggleId(ids, eq.id))
                    }
                  />
                  <span>{eq.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        <h3>Ingrédients</h3>
        {ingredients.map((line, index) => (
          <section className="recipe-editor__line" key={line.id}>
            <IngredientAutocomplete
              label={`Ingrédient ${index + 1}`}
              value={line.selection}
              onChange={(selection) => changeLine(line.id, { selection })}
              disabled={saving}
            />
            <label>
              Quantité {index + 1}
              <input
                aria-label={`Quantité ${index + 1}`}
                type="number"
                step="any"
                min="0"
                required
                value={line.quantity}
                onChange={(e) =>
                  changeLine(line.id, { quantity: e.target.value })
                }
              />
            </label>
            <label>
              Unité {index + 1}
              <select
                value={line.unit}
                onChange={(e) =>
                  changeLine(line.id, { unit: e.target.value as RecipeUnit })
                }
              >
                {RECIPE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit === 'piece' ? 'pièce' : unit}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                setIngredients((lines) => lines.filter((l) => l.id !== line.id))
              }
            >
              Retirer l’ingrédient {index + 1}
            </button>
          </section>
        ))}
        <button
          type="button"
          disabled={ingredients.length >= 100}
          onClick={() =>
            setIngredients((lines) => [
              ...lines,
              {
                id: nextId.current++,
                selection: null,
                quantity: '',
                unit: 'g',
              },
            ])
          }
        >
          Ajouter un ingrédient
        </button>

        <h3>Préparation</h3>
        {steps.map((step, index) => (
          <section className="recipe-editor__line" key={step.id}>
            <label>
              Étape {index + 1}
              <textarea
                required
                maxLength={2000}
                value={step.instruction}
                onChange={(e) =>
                  setSteps((current) =>
                    current.map((s) =>
                      s.id === step.id
                        ? { ...s, instruction: e.target.value }
                        : s,
                    ),
                  )
                }
              />
            </label>
            <div className="recipe-editor__actions">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveStep(index, -1)}
              >
                Monter l’étape {index + 1}
              </button>
              <button
                type="button"
                disabled={index === steps.length - 1}
                onClick={() => moveStep(index, 1)}
              >
                Descendre l’étape {index + 1}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSteps((current) => current.filter((s) => s.id !== step.id))
                }
              >
                Retirer l’étape {index + 1}
              </button>
            </div>
          </section>
        ))}
        <button
          type="button"
          disabled={steps.length >= 200}
          onClick={() =>
            setSteps((current) => [
              ...current,
              { id: nextId.current++, instruction: '' },
            ])
          }
        >
          Ajouter une étape
        </button>

        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            marginTop: '16px',
          }}
        >
          Les valeurs CIQUAL affichées sont des références pour 100 g, pas les
          macros calculées de la recette. Le calcul nutritionnel sera fourni par
          S3-T03. Un ingrédient manuel ne possède aucune valeur nutritionnelle
          associée.
        </p>
        <button
          type="submit"
          style={{
            marginTop: '16px',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer la recette'}
        </button>
      </fieldset>
      {error && (
        <p role="alert" style={{ color: 'red', marginTop: '16px' }}>
          {error}
        </p>
      )}
    </form>
  )
}

export { RecipeCreatePage }
