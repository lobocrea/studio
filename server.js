
'use strict'

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PROXY_PORT || 3001;

app.use(cors());
app.use(express.json());

class TheirStackAPI {
  constructor() {
    this.baseUrl = 'https://api.theirstack.com/v1';
    this.apiKey = process.env.THEIRSTACK_API_KEY;
  }

  async searchJobs({ keyword = '', location = '', limit = 10, contractType = '' }) {
    try {
      if (!this.apiKey) {
        throw new Error('THEIRSTACK_API_KEY debe estar configurado en las variables de entorno');
      }

      console.log('🌐 Usando TheirStack API para buscar trabajos de InfoJobs...');
      
      const query_and = [keyword, contractType].filter(Boolean);

      const requestBody = {
        q_and: query_and,
        job_country_code_or: [location || 'ES'],
        job_source_or: ['infojobs'],
        limit: limit,
        offset: 0
      };

      console.log('🔍 Cuerpo de la petición a TheirStack:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(`${this.baseUrl}/jobs/search`, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const jobs = response.data.jobs?.map(job => ({
        id: job.id || `theirstack-${Date.now()}-${Math.random()}`,
        title: job.job_title || job.title,
        companyName: job.company,
        location: job.location,
        salary: job.salary_string || job.salary,
        description: job.description,
        url: job.url || job.final_url,
        technologies: job.technology_names || job.company_keywords || [],
        companyLogo: job.logo_url || null, 
        perks: job.perks || [],
      })) || [];

      console.log(`✅ TheirStack API: ${jobs.length} trabajos encontrados`);
      return jobs;

    } catch (error) {
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error('❌ Error en el Proxy con TheirStack API:', errorMessage);
      throw new Error(`Error obteniendo trabajos de TheirStack API: ${errorMessage}`);
    }
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        return { available: false, error: 'API key no configurada' };
      }

      // El endpoint de health podría estar en la raíz, no en /v1
      const response = await axios.get(`https://api.theirstack.com/health`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 10000
      });

      return { available: true, status: response.status, data: response.data };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}

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
