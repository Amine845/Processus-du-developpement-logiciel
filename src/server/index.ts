import express from 'express'
import cors from 'cors'
import { recipeRouter } from './interfaces/recipe.routes'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API REST Recettes opérationnelle' })
})

app.use('/api/recipes', recipeRouter)

app.listen(PORT, () => {
  console.log(`Serveur API REST démarré sur http://localhost:${PORT}`)
})

export default app
