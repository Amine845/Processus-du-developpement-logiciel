import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IngredientAutocomplete from '../features/ingredients/IngredientAutocomplete'
import {
  recipePayload,
  type IngredientDraft,
} from '../features/recipes/recipe-form'
import { RECIPE_UNITS, type RecipeUnit } from '../../shared/types/recipe.types'
import { recipesApi } from '../api/recipes.api'
import './recipe-editor.css'

// Vrais tags issus de la table "Tag" de la BDD
const DB_TAGS = [
  { key: 'cereale', label: 'Céréale' },
  { key: 'legume', label: 'Légume' },
  { key: 'fruit', label: 'Fruit' },
  { key: 'legumineuse', label: 'Légumineuse' },
  { key: 'viande', label: 'Viande' },
  { key: 'poisson-et-fruit-de-mer', label: 'Poisson et fruit de mer' },
  { key: 'produit-laitier', label: 'Produit laitier' },
  { key: 'oeuf', label: 'Œuf' },
  { key: 'matiere-grasse', label: 'Matière grasse' },
  { key: 'produit-sucre', label: 'Produit sucré' },
  { key: 'epice-et-aromate', label: 'Épice et aromate' },
]

// Vrais équipements issus de la table "Equipment" de la BDD
const DB_EQUIPMENT = [
  { key: 'four', label: 'Four' },
  { key: 'plaque-de-cuisson', label: 'Plaque de cuisson' },
  { key: 'micro-ondes', label: 'Micro-ondes' },
  { key: 'air-fryer', label: 'Air Fryer' },
  { key: 'casserole', label: 'Casserole' },
  { key: 'poele', label: 'Poêle' },
  { key: 'mixeur', label: 'Mixeur' },
  { key: 'fouet', label: 'Fouet' },
  { key: 'saladier', label: 'Saladier' },
  { key: 'balance-de-cuisine', label: 'Balance de cuisine' },
  { key: 'couteau', label: 'Couteau' },
  { key: 'planche-a-decouper', label: 'Planche à découper' },
]

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

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([])

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

  const toggleTag = (key: string) => {
    setSelectedTags((prev) =>
        prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key],
    )
  }

  const toggleEquipment = (key: string) => {
    setSelectedEquipments((prev) =>
        prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key],
    )
  }

  return (
      <form
          className="recipe-editor"
          onSubmit={async (event) => {
            event.preventDefault()
            if (submitting.current) return
            setError('')
            try {
              const basePayload = recipePayload({
                title,
                description,
                servings,
                ingredients,
                steps,
              })

              // Envoi des labels et keys pour couvrir tous les schémas DTO back-end
              const payload = {
                ...basePayload,
                tags: selectedTags,
                tagKeys: selectedTags,
                equipment: selectedEquipments,
                equipmentKeys: selectedEquipments,
              }

              submitting.current = true
              setSaving(true)
              const recipe = await recipesApi.create(payload as any)
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

          {/* SELECTION TAGS BDD */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Tags & Catégories</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DB_TAGS.map((tag) => {
                const active = selectedTags.includes(tag.key)
                return (
                    <label
                        key={tag.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 16px',
                          borderRadius: '999px',
                          border: '1px solid',
                          borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                          background: active ? 'var(--color-accent)' : 'var(--color-surface)',
                          color: active ? 'white' : 'inherit',
                          cursor: 'pointer',
                          fontSize: 'var(--text-sm)',
                          fontWeight: active ? 600 : 400,
                          transition: 'all 0.2s ease',
                        }}
                    >
                      <input
                          type="checkbox"
                          style={{ display: 'none' }}
                          checked={active}
                          onChange={() => toggleTag(tag.key)}
                      />
                      <span>{tag.label}</span>
                    </label>
                )
              })}
            </div>
          </div>

          {/* SELECTION EQUIPEMENT BDD */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Matériel requis</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DB_EQUIPMENT.map((eq) => {
                const active = selectedEquipments.includes(eq.key)
                return (
                    <label
                        key={eq.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: active ? 'var(--color-text)' : 'var(--color-border)',
                          background: active ? 'var(--color-text)' : 'var(--color-surface)',
                          color: active ? 'var(--color-surface)' : 'inherit',
                          cursor: 'pointer',
                          fontSize: 'var(--text-sm)',
                          transition: 'all 0.2s ease',
                        }}
                    >
                      <input
                          type="checkbox"
                          style={{ display: 'none' }}
                          checked={active}
                          onChange={() => toggleEquipment(eq.key)}
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

          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '16px' }}>
            Les valeurs CIQUAL affichées sont des références pour 100 g, pas les
            macros calculées de la recette. Le calcul nutritionnel sera fourni par
            S3-T03. Un ingrédient manuel ne possède aucune valeur nutritionnelle
            associée.
          </p>
          <button type="submit" style={{ marginTop: '16px', background: 'var(--color-accent)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}>
            {saving ? 'Enregistrement…' : 'Enregistrer la recette'}
          </button>
        </fieldset>
        {error && <p role="alert" style={{ color: 'red', marginTop: '16px' }}>{error}</p>}
      </form>
  )
}

export { RecipeCreatePage }