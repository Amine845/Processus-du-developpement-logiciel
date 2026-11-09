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
        <p>
          Les valeurs CIQUAL affichées sont des références pour 100 g, pas les
          macros calculées de la recette. Le calcul nutritionnel sera fourni par
          S3-T03. Un ingrédient manuel ne possède aucune valeur nutritionnelle
          associée.
        </p>
        <button type="submit">
          {saving ? 'Enregistrement…' : 'Enregistrer la recette'}
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
