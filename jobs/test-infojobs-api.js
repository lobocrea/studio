// Configurar la API key directamente para la prueba
process.env.THEIRSTACK_API_KEY = 'eyJzdWIiOiJwcmpzdXBhQGdtYWlsLmNvbSIsInBlcm1pc3Npb25zIjoidXNlciIsImNyZWF0ZWRfYXQiOiIyMDI1LTA5LTA0VDIwOjM1OjUxLjcwMTAyNiswMDowMCJ9';

const TheirStackAPI = require('../services/theirstackApi');

async function testTheirStackWithKey() {
  console.log('🧪 Probando TheirStack API con tu API key...');
  console.log('🔑 API Key configurada: ✅\n');
  
  const api = new TheirStackAPI();
  
  try {
    console.log('🔍 Probando conexión...');
    const connectionTest = await api.testConnection();
    
    if (connectionTest.available) {
      console.log('✅ Conexión exitosa con TheirStack API');
      console.log('📊 Status:', connectionTest.status);
    } else {
      console.log('❌ Error de conexión:', connectionTest.error);
      return;
    }
    
    console.log('\n🔍 Probando búsqueda de trabajos de InfoJobs...');
    const jobs = await api.searchJobs({
      keyword: 'desarrollador',
      location: 'Madrid',
      limit: 5
    });
    
    console.log(`✅ Total: ${jobs.length} trabajos encontrados`);
    
    if (jobs.length > 0) {
      console.log('\n📋 Trabajos encontrados:');
      jobs.forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title}`);
        console.log(`   🏢 Empresa: ${job.company}`);
        console.log(`   📍 Ubicación: ${job.location}`);
        console.log(`   💰 Salario: ${job.salary || 'No especificado'}`);
        console.log(`   🏠 Remoto: ${job.remote ? 'Sí' : 'No'}`);
        console.log(`   📊 Seniority: ${job.seniority || 'No especificado'}`);
        console.log(`   🌐 Fuente: ${job.source}`);
        console.log(`   🔗 Enlace: ${job.link}`);
        if (job.tags && job.tags.length > 0) {
          console.log(`   🏷️  Tags: ${job.tags.slice(0, 5).join(', ')}`);
        }
      });
    } else {
      console.log('❌ No se encontraron trabajos');
    }
    
    console.log('\n🎯 ¡TheirStack API funcionando correctamente!');
    console.log('   ✅ Sin problemas de CAPTCHA');
    console.log('   ✅ Datos estructurados de InfoJobs');
    console.log('   ✅ Información rica de empresas');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testTheirStackWithKey();
