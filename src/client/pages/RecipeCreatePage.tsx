// src/client/pages/RecipeCreatePage.tsx
import React, { useState } from 'react'
import { Trash2, Plus, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { recipesApi } from '../../client/api/recipes.api'
import { ciqualApi } from '../../client/api/ciqual.api'

interface RecipeIngredientDraft {
    localId: string
    name: string
    quantity: number | ''
    unit: string
}

interface RecipeDraft {
    title: string
    description: string
    equipment: string[]
    tags: string[]
    isVegetarian: boolean
    isGlutenFree: boolean
    isLactoseFree: boolean
    portions: number
    ingredients: RecipeIngredientDraft[]
}

const EQUIPMENTS = ['Four', 'Plaques', 'Air Fryer', 'Mixer', 'Micro-ondes']
const TAGS = ['Gourmand', 'Rapide', 'Healthy', 'Pas cher', 'Dessert', 'Plat principal']

const UNITS = [
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
    { value: 'ml', label: 'ml' },
    { value: 'l', label: 'l' },
    { value: 'piece', label: 'unité(s)' },
] as const

export const RecipeCreatePage: React.FC = () => {
    const navigate = useNavigate()

    const [suggestions, setSuggestions] = useState<{ code: string; name: string }[]>([])

    const [draft, setDraft] = useState<RecipeDraft>({
        title: '',
        description: '',
        equipment: [],
        tags: [],
        isVegetarian: false,
        isGlutenFree: false,
        isLactoseFree: false,
        portions: 2,
        ingredients: [
            { localId: crypto.randomUUID(), name: '', quantity: '', unit: 'g' },
        ],
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // --- GESTION DES CHAMPS SIMPLES ---
    const handleBasicChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target
        setDraft((prev) => ({ ...prev, [name]: value }))
    }

    const toggleEquipment = (eq: string) => {
        setDraft((prev) => ({
            ...prev,
            equipment: prev.equipment.includes(eq)
                ? prev.equipment.filter((item) => item !== eq)
                : [...prev.equipment, eq],
        }))
    }

    const toggleTag = (tag: string) => {
        setDraft((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((item) => item !== tag)
                : [...prev.tags, tag],
        }))
    }

    const handleDietChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setDraft(prev => ({ ...prev, [name]: checked }))
    }

    // --- GESTION DYNAMIQUE ET RECHERCHE CIQUAL DES INGRÉDIENTS ---
    const addIngredient = () => {
        setDraft((prev) => ({
            ...prev,
            ingredients: [
                ...prev.ingredients,
                { localId: crypto.randomUUID(), name: '', quantity: '', unit: 'g' },
            ],
        }))
    }

    const removeIngredient = (idToRemove: string) => {
        setDraft((prev) => ({
            ...prev,
            ingredients: prev.ingredients.filter((ing) => ing.localId !== idToRemove),
        }))
    }

    const handleIngredientChange = async (
        id: string,
        field: keyof RecipeIngredientDraft,
        value: string | number,
    ) => {
        setDraft((prev) => ({
            ...prev,
            ingredients: prev.ingredients.map((ing) =>
                ing.localId === id ? { ...ing, [field]: value } : ing,
            ),
        }))

        if (field === 'name' && typeof value === 'string') {
            const searchTerm = value.trim()
            if (searchTerm.length >= 2) {
                try {
                    const res = await ciqualApi.search(searchTerm, { limit: 15 })
                    const items = Array.isArray(res) ? res : (res as any).items || (res as any).data || []
                    setSuggestions(items)
                } catch (err) {
                    console.error('Erreur recherche CIQUAL:', err)
                }
            } else if (searchTerm.length === 0) {
                setSuggestions([])
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMsg(null)

        try {
            const payload = {
                title: draft.title.trim(),
                description: draft.description.trim() || null,
                servings: Number(draft.portions),
                // Nouvelles propriétés pour le backend
                equipment: draft.equipment,
                tags: draft.tags,
                isVegetarian: draft.isVegetarian,
                isGlutenFree: draft.isGlutenFree,
                isLactoseFree: draft.isLactoseFree,
                steps: [
                    {
                        instruction:
                            draft.description.trim() || 'Préparation de la recette',
                    },
                ],
                ingredients: draft.ingredients
                    .filter((ing) => ing.name.trim() !== '')
                    .map((ing) => ({
                        canonicalName: ing.name.trim(),
                        quantity: Number(ing.quantity) || 1,
                        unit: ing.unit,
                    })),
            }

            await recipesApi.create(payload as any)
            navigate('/recipes')
        } catch (err: any) {
            console.error('Erreur API détaillée :', err)

            let details = ''
            if (Array.isArray(err.issues) && err.issues.length > 0) {
                details = err.issues
                    .map((issue: any) =>
                        typeof issue === 'string'
                            ? issue
                            : `${issue.path?.join('.') ?? 'champ'}: ${issue.message}`,
                    )
                    .join(' | ')
            }

            const mainMessage = err.code || err.message || 'Erreur serveur'
            setErrorMsg(details ? `${mainMessage} -> ${details}` : mainMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2
                style={{
                    fontSize: 'var(--text-xl)',
                    marginBottom: 'var(--spacing-md)',
                }}
            >
                Créer une recette
            </h2>

            <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
                {/* 1. INFORMATIONS DE BASE */}
                <section
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                    <label>
                        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Titre</span>
                        <input
                            required
                            type="text"
                            name="title"
                            value={draft.title}
                            onChange={handleBasicChange}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </label>
                    <label>
                        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Description</span>
                        <textarea
                            required
                            name="description"
                            value={draft.description}
                            onChange={handleBasicChange}
                            rows={3}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </label>
                    <label>
                        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Portions</span>
                        <input
                            required
                            type="number"
                            min="1"
                            name="portions"
                            value={draft.portions}
                            onChange={handleBasicChange}
                            style={{ padding: '8px', width: '80px' }}
                        />
                    </label>
                </section>

                {/* 2. TAGS */}
                <section>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '8px' }}>Tags</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {TAGS.map((tag) => (
                            <label
                                key={tag}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'var(--color-surface)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={draft.tags.includes(tag)}
                                    onChange={() => toggleTag(tag)}
                                />
                                <span style={{ fontSize: 'var(--text-sm)' }}>{tag}</span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* 3. MATÉRIEL REQUIS */}
                <section>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '8px' }}>Matériel requis</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {EQUIPMENTS.map((eq) => (
                            <label
                                key={eq}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'var(--color-surface)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={draft.equipment.includes(eq)}
                                    onChange={() => toggleEquipment(eq)}
                                />
                                <span style={{ fontSize: 'var(--text-sm)' }}>{eq}</span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* 4. RÉGIMES ALIMENTAIRES */}
                <section>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '8px' }}>Régimes alimentaires</span>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="checkbox"
                                name="isVegetarian"
                                checked={draft.isVegetarian}
                                onChange={handleDietChange}
                            />
                            <span style={{ fontSize: 'var(--text-sm)' }}>Végétarien</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="checkbox"
                                name="isGlutenFree"
                                checked={draft.isGlutenFree}
                                onChange={handleDietChange}
                            />
                            <span style={{ fontSize: 'var(--text-sm)' }}>Sans gluten</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="checkbox"
                                name="isLactoseFree"
                                checked={draft.isLactoseFree}
                                onChange={handleDietChange}
                            />
                            <span style={{ fontSize: 'var(--text-sm)' }}>Sans lactose</span>
                        </label>
                    </div>
                </section>

                {/* 5. INGRÉDIENTS (avec autocomplétion dynamique CIQUAL) */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Ingrédients</span>
                        <button
                            type="button"
                            onClick={addIngredient}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--color-accent)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={16} /> Ajouter
                        </button>
                    </div>

                    <datalist id="ciqual-suggestions">
                        {suggestions.map((item, idx) => (
                            <option key={item.code || idx} value={item.name} />
                        ))}
                    </datalist>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {draft.ingredients.map((ing) => (
                            <div key={ing.localId} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    required
                                    type="text"
                                    list="ciqual-suggestions"
                                    placeholder="Nom de l'ingrédient..."
                                    value={ing.name}
                                    onChange={(e) => handleIngredientChange(ing.localId, 'name', e.target.value)}
                                    style={{ flex: 1, padding: '8px' }}
                                />
                                <input
                                    required
                                    type="number"
                                    min="0.1"
                                    step="any"
                                    placeholder="Qté"
                                    value={ing.quantity}
                                    onChange={(e) =>
                                        handleIngredientChange(
                                            ing.localId,
                                            'quantity',
                                            e.target.value ? Number(e.target.value) : '',
                                        )
                                    }
                                    style={{ width: '60px', padding: '8px' }}
                                />
                                <select
                                    value={ing.unit}
                                    onChange={(e) => handleIngredientChange(ing.localId, 'unit', e.target.value)}
                                    style={{ padding: '8px' }}
                                >
                                    {UNITS.map((u) => (
                                        <option key={u.value} value={u.value}>
                                            {u.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => removeIngredient(ing.localId)}
                                    style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {errorMsg && (
                    <div style={{ color: 'red', fontSize: 'var(--text-sm)', textAlign: 'center', marginTop: '16px', wordBreak: 'break-word' }}>
                        {errorMsg}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        background: isSubmitting ? 'var(--color-text-muted)' : 'var(--color-accent)',
                        color: 'white',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        marginTop: '16px',
                    }}
                >
                    <Save size={20} />
                    {isSubmitting ? 'Enregistrement en cours...' : 'Enregistrer la recette'}
                </button>
            </form>
        </div>
    )
}