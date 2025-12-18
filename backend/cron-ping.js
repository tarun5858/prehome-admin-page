
import cron from 'node-cron';
import axios from 'axios'; 

// UPDATE THIS LIST: Use localhost for your backend until it's deployed.
const API_URLS = [
    // 1. Your Local Backend (assuming it runs on port 5000 and the /health route exists)
    // NOTE: This will ONLY work if your local server is running!
    'https://website-leads-dashboard.onrender.com/health', 
    // "http://localhost:5000/health"

];

// 2. Define the job function
const pingApi = async () => {
    console.log(`\n--- PING CYCLE STARTED: ${new Date().toLocaleTimeString()} ---`);
    
    for (const API_URL of API_URLS) {
        try {
            // Use axios.get for simple health checks
            const response = await axios.get(API_URL);

            if (response.status >= 200 && response.status < 300) {
                console.log(` Success (Status ${response.status}): ${API_URL}`);
            } else {
                console.error(` Failed (Status ${response.status}): ${API_URL}`);
            }
        } catch (error) {
            // Log errors related to network issues (like connection refused for localhost)
            console.error(` Error Pinging ${API_URL}:`, error.message);
        }
    }
    console.log(`--- PING CYCLE FINISHED ---`);
};

// 3. Define the Cron Schedule (e.g., run every 15 minutes)
cron.schedule('*/15 * * * *', pingApi); 

console.log(`Cron job scheduled. Pinging ${API_URLS.length} endpoints...`);