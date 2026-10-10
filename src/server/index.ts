import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares globaux
app.use(cors())
app.use(express.json())

// Route de test / healthcheck
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'API REST Recettes opérationnelle' })
})

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur API REST démarré sur http://localhost:${PORT}`)
})

export default app