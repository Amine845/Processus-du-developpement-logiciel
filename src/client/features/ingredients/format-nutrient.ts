import type { CiqualNutrientDTO } from '../../../shared/types/ciqual.types'

const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/** Texte affichable ; une valeur absente, tracée ou non quantifiée n'est jamais « 0 ». */
export function formatNutrient(nutrient: CiqualNutrientDTO): string {
  switch (nutrient.status) {
    case 'exact':
      return nutrient.value === null
        ? 'Non renseigné'
        : `${number.format(nutrient.value)} ${nutrient.unit}`
    case 'less_than':
      return nutrient.upperBoundExclusive === null
        ? 'Non renseigné'
        : `< ${number.format(nutrient.upperBoundExclusive)} ${nutrient.unit}`
    case 'trace':
      return 'Traces (non quantifié)'
    case 'missing':
      return 'Non renseigné'
  }
}
