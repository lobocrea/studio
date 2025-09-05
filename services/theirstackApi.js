
const axios = require('axios');

class TheirStackAPI {
  constructor() {
    this.baseUrl = 'https://api.theirstack.com';
    this.apiKey = process.env.THEIRSTACK_API_KEY;
  }

  async searchJobs({ keyword = '', location = '', limit = 10 }) {
    try {
      if (!this.apiKey) {
        throw new Error('THEIRSTACK_API_KEY debe estar configurado en las variables de entorno');
      }

      console.log('🌐 Usando TheirStack API para buscar trabajos de InfoJobs...');
      
      // Construir parámetros de búsqueda según la documentación de TheirStack
      const params = {
        q: keyword || 'trabajo',
        location: location || 'España',
        limit: limit,
        source: 'infojobs', // Especificar que queremos datos de InfoJobs
        country: 'ES' // España para InfoJobs
      };

      const response = await axios.get(`${this.baseUrl}/jobs`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: params,
        timeout: 30000
      });

      // Transformar los datos al formato estándar basado en la estructura de TheirStack
      const jobs = response.data.jobs?.map(job => ({
        id: job.id || `theirstack-${Date.now()}-${Math.random()}`,
        title: job.job_title || job.title,
        company: job.company,
        location: job.location,
        salary: job.salary_string || job.salary,
        description: job.description,
        link: job.url || job.final_url,
        publishDate: job.date_posted || job.discovered_at,
        tags: job.technology_names || job.company_keywords || [],
        source: 'InfoJobs (via TheirStack)',
        remote: job.remote || false,
        seniority: job.seniority,
        company_domain: job.company_domain,
        scraped_at: new Date().toISOString()
      })) || [];

      console.log(`✅ TheirStack API: ${jobs.length} trabajos encontrados`);
      return jobs;

    } catch (error) {
      console.error('❌ Error con TheirStack API:', error.response?.data || error.message);
      throw new Error(`Error obteniendo trabajos de TheirStack API: ${error.message}`);
    }
  }

  // Método para verificar si la API está disponible
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

  // Método para obtener información de la API
  async getApiInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/info`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = TheirStackAPI;
