import RecipeCreatePage from '../pages/RecipeCreatePage'
import RecipeDetailPage from '../pages/RecipeDetailPage'
import RecipeListPage from '../pages/RecipeListPage'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/layout'

/* Pages temporaires épurées */
const PlannerPage = () => (
  <div>
    <h2 style={{ fontSize: 'var(--text-xl)' }}>Planificateur & courses</h2>
    <p
      style={{
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        marginTop: '4px',
      }}
    >
      Menu de la semaine, suivi des macros et liste d'ingrédients interactive.
    </p>
  </div>
)

const ProfilePage = () => (
  <div>
    <h2 style={{ fontSize: 'var(--text-xl)' }}>Profil & préférences</h2>
    <p
      style={{
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        marginTop: '4px',
      }}
    >
      Gestion des allergies, matériel disponible (Air Fryer, four...) et
      objectifs.
    </p>
  </div>
)

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeListPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/recipes/new" element={<RecipeCreatePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
