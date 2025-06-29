const express = require('express');
const path = require('path');
const cors = require('cors');

// Load environment variables from the root .env file
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Import our new library function
const { callLinkedinTool } = require('../build/index.js');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/search', async (req, res) => {
    const { first_name, last_name, location, keywords } = req.body;
    console.log('Search request received:', req.body);

    const toolName = 'search_linkedin_users';
    const toolArgs = {
        first_name: first_name || undefined,
        last_name: last_name || undefined,
        location: location || undefined,
        keywords: keywords || undefined,
        count: 10
    };

    try {
        // Call the function directly! No more processes.
        const results = await callLinkedinTool(toolName, toolArgs);
        
        // Log the raw results to the terminal to see their structure
        console.log('Raw API results:', JSON.stringify(results, null, 2));

        res.json(results);
    } catch (error) {
        console.error('Error calling LinkedIn tool:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/index.html to use the app.`);
}); 