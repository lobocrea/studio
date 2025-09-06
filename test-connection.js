// Simple test script to verify TheirStack API connection
require('dotenv').config();

async function testAPI() {
    const apiKey = process.env.THEIRSTACK_API;
    
    if (!apiKey) {
        console.error('❌ THEIRSTACK_API not found in .env file');
        return;
    }
    
    console.log('🔍 Testing TheirStack API connection...');
    console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
    
    const requestBody = {
        page: 0,
        limit: 3,
        job_country_code_or: ['ES'],
        posted_at_max_age_days: 7,
        include_total_results: true,
        order_by: [{ field: "date_posted", desc: true }],
        blur_company_data: false
    };
    
    try {
        const response = await fetch("https://api.theirstack.com/v1/jobs/search", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('❌ API Error:', errorBody);
            return;
        }
        
        const data = await response.json();
        console.log('✅ API connection successful!');
        console.log('📊 Response structure:', {
            hasMetadata: !!data.metadata,
            hasData: !!data.data,
            dataIsArray: Array.isArray(data.data),
            jobCount: data.data ? data.data.length : 0,
            totalResults: data.metadata?.total_results
        });
        
        if (data.data && data.data.length > 0) {
            console.log('\n📋 First job sample:');
            const job = data.data[0];
            console.log('- ID:', job.id);
            console.log('- Title:', job.job_title);
            console.log('- Company:', job.company_object?.name || job.company);
            console.log('- Location:', job.locations?.[0]?.city || job.location);
            console.log('- Posted:', job.date_posted);
            console.log('- Salary:', job.salary_string || 'Not specified');
        } else {
            console.log('⚠️ No jobs found in response');
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testAPI();
