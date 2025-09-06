/**
 * Test script to verify TheirStack API connection
 * Run this to test the API connection before using the main findJobs function
 */

import { findJobs } from './find-jobs';

async function testTheirStackAPI() {
    console.log('🔍 Testing TheirStack API connection...');
    
    try {
        const result = await findJobs({
            keyword: 'JavaScript',
            province: 'Madrid'
        });
        
        console.log('✅ API connection successful!');
        console.log(`📊 Found ${result.jobs.length} jobs`);
        
        if (result.jobs.length > 0) {
            console.log('\n📋 Sample job:');
            console.log('- Title:', result.jobs[0].title);
            console.log('- Company:', result.jobs[0].company);
            console.log('- Location:', result.jobs[0].location);
            console.log('- Modality:', result.jobs[0].modality);
            if (result.jobs[0].salary) {
                console.log('- Salary:', result.jobs[0].salary);
            }
            console.log('- Description:', result.jobs[0].description.substring(0, 100) + '...');
        } else {
            console.log('⚠️  No jobs found. This could indicate:');
            console.log('   - API key issues');
            console.log('   - No jobs matching the criteria');
            console.log('   - API response structure changes');
        }
        
    } catch (error) {
        console.error('❌ API connection failed:');
        console.error(error);
        
        if (error instanceof Error) {
            if (error.message.includes('THEIRSTACK_API key is not configured')) {
                console.log('\n💡 Solution: Add your TheirStack API key to environment variables:');
                console.log('   THEIRSTACK_API=your_api_key_here');
            } else if (error.message.includes('401')) {
                console.log('\n💡 Solution: Check if your API key is valid and has proper permissions');
            } else if (error.message.includes('429')) {
                console.log('\n💡 Solution: You have exceeded the API rate limit. Wait and try again.');
            } else if (error.message.includes('403')) {
                console.log('\n💡 Solution: Your API key may not have access to this endpoint');
            }
        }
    }
}

// Export for use in other files
export { testTheirStackAPI };

// Run test if this file is executed directly
if (require.main === module) {
    testTheirStackAPI();
}
