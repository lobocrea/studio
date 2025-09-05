
'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

class TheirStackAPI {
  constructor() {
    this.baseUrl = 'https://api.theirstack.com/v1';
    this.apiKey = process.env.THEIR_STACK_API_KEY;
  }

  async searchJobs({ keyword = '', location = '', contractType = '', limit = 20 }) {
    try {
      if (!this.apiKey) {
        throw new Error('THEIRSTACK_API_KEY debe estar configurado en las variables de entorno');
      }

      console.log('🌐 Proxy Server: Buscando trabajos en TheirStack...');
      
      const requestBody = {
        page: 0,
        limit: limit,
        posted_at_max_age_days: 60,
        order_by: [{ field: "date_posted", desc: true }],
        include_total_results: false,
      };
      
      let generalQuery = '';

      if (keyword) {
        generalQuery += `${keyword} `;
      }
      
      if(contractType){
        generalQuery += `${contractType} `;
      }

      if (location) {
        // Assuming location is a city/province in Spain for now.
        // The API seems to prefer country codes.
        requestBody.job_country_code_or = ["ES"];
        generalQuery += location;
      }

      if (generalQuery.trim()) {
        requestBody.q = generalQuery.trim();
      }
      
      console.log('Proxy Server: Enviando petición a TheirStack con body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(`${this.baseUrl}/jobs/search`, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Mapear la respuesta de TheirStack al formato esperado por el frontend (JobOffer)
      const jobs = response.data.jobs?.map((job) => ({
            id: job.id,
            title: job.title,
            companyName: job.company_name, // Mapeo de company_name a companyName
            companyLogo: job.company_logo, // Mapeo de company_logo a companyLogo
            perks: job.perks || [],
            salary: job.salary_range ? `${job.salary_range.min} - ${job.salary_range.max} ${job.salary_range.currency}`: null,
            location: job.location,
            url: job.url, // Mapeo de url a url
            technologies: job.technologies || [],
        })) || [];

      console.log(`✅ TheirStack API: ${jobs.length} trabajos encontrados`);
      return jobs;

    } catch (error) {
      console.error('❌ Error en el Proxy con TheirStack API:', error.response?.data || error.message);
      throw new Error(`Error obteniendo trabajos desde el proxy: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        return { available: false, error: 'API key no configurada' };
      }

      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      return { 
        available: true, 
        status: response.status,
        data: response.data 
      };
    } catch (error) {
      return { 
        available: false, 
        error: error.message 
      };
    }
  }
}

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const theirStackApi = new TheirStackAPI();

app.get('/api/jobs', async (req, res) => {
  const { skill, location, contractType, limit } = req.query;
  try {
    const jobs = await theirStackApi.searchJobs({
      keyword: skill,
      location: location,
      contractType: contractType,
      limit: parseInt(limit, 10) || 20,
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar empleos', error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
    try {
        const result = await theirStackApi.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ available: false, error: error.message });
    }
});


app.listen(port, () => {
  console.log(`🚀 Servidor proxy escuchando en http://localhost:${port}`);
});
