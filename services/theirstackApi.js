
const axios = require('axios');

class TheirStackAPI {
  constructor() {
    // El proxy se ejecutará localmente
    this.proxyBaseUrl = 'http://localhost:3001'; 
  }

  async searchJobs({ keyword = '', location = '', limit = 10 }) {
    try {
      console.log('🌐 Llamando al proxy local para buscar trabajos...');
      
      const response = await axios.get(`${this.proxyBaseUrl}/api/jobs`, {
        params: {
          skill: keyword,
          location: location,
          limit: limit
        },
        timeout: 45000 // Aumentamos el timeout por si el proxy tarda en responder
      });

      // La respuesta del proxy ya debería venir en el formato que esperamos
      console.log(`✅ Proxy respondió con ${response.data.length} trabajos`);
      return response.data;

    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('❌ Error llamando al proxy local:', errorMessage);
      throw new Error(`Error obteniendo trabajos desde el proxy: ${errorMessage}`);
    }
  }

  async testConnection() {
    try {
      console.log('🌐 Probando conexión con el proxy local...');
      const response = await axios.get(`${this.proxyBaseUrl}/api/health`, {
        timeout: 15000
      });
      return response.data; // El proxy nos dirá si la conexión con TheirStack es exitosa
    } catch (error) {
       return { 
        available: false, 
        error: `No se pudo conectar al servidor proxy en ${this.proxyBaseUrl}. ¿Está iniciado? (${error.message})`
      };
    }
  }

  // Este método ya no es necesario, el proxy maneja la info
  async getApiInfo() {
    return { info: "Este método se comunica a través del proxy local." };
  }
}

module.exports = TheirStackAPI;
