const axios = require('axios');

class TheirStackAPI {
  constructor() {
    this.baseUrl = 'https://api.theirstack.com/v1';
    this.apiKey = process.env.THEIRSTACK_API_KEY;
  }

  async searchJobs({ keyword = '', location = '', contractType = '', limit = 10 }) {
    try {
      if (!this.apiKey) {
        throw new Error('THEIRSTACK_API_KEY debe estar configurado en las variables de entorno');
      }

      console.log('🌐 Usando TheirStack API para buscar trabajos de InfoJobs...');
      
      // Combinar todos los términos de búsqueda en el campo 'q'
      const searchTerms = [keyword, contractType, location === 'all' ? '' : location].filter(Boolean);
      const queryString = searchTerms.join(' ');

      const requestBody = {
        job_country_code_or: ['ES'],
        job_source_or: ['infojobs'],
        posted_at_max_age_days: 30,
        limit: limit,
        offset: 0
      };
      
      // Añadir 'q' solo si hay términos de búsqueda
      if (queryString) {
        requestBody.q = queryString;
      }

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
        remote: job.remote || false,
        seniority: job.seniority,
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

module.exports = TheirStackAPI;
