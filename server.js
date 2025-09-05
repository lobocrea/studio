
'use strict'

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const TheirStackAPI = require('./services/theirstackApi');

dotenv.config();

const app = express();
const port = process.env.PROXY_PORT || 3001;

app.use(cors());
app.use(express.json());

const theirStackApi = new TheirStackAPI();

app.get('/api/jobs', async (req, res) => {
    try {
        const { skill, location, contractType, limit } = req.query;
        const jobs = await theirStackApi.searchJobs({
            keyword: skill,
            location: location,
            contractType: contractType,
            limit: limit ? parseInt(limit, 10) : 20,
        });
        res.json(jobs);
    } catch (error) {
        console.error("Error en el endpoint /api/jobs:", error.message);
        res.status(500).json({ error: 'Error interno del servidor al buscar trabajos.' });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        const healthStatus = await theirStackApi.testConnection();
        res.json(healthStatus);
    } catch (error) {
        console.error("Error en el endpoint /api/health:", error.message);
        res.status(500).json({ error: 'Error interno del servidor al verificar la salud.' });
    }
});

app.listen(port, () => {
  console.log(`🚀 Servidor proxy escuchando en http://localhost:${port}`);
});
