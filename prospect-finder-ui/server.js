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

    const searchToolName = 'search_linkedin_users';
    const searchToolArgs = {
        first_name: first_name || undefined,
        last_name: last_name || undefined,
        location: location || undefined,
        keywords: keywords || undefined,
        count: 10
    };

    try {
        const searchResults = await callLinkedinTool(searchToolName, searchToolArgs);
        res.json(searchResults || []); // Return basic results
    } catch (error) {
        console.error('Error calling LinkedIn search tool:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

app.post('/api/details', async (req, res) => {
    const { urn } = req.body;
    if (!urn || typeof urn !== 'string') {
        return res.status(400).json({ error: 'Valid user URN is required' });
    }

    console.log(`Fetching details for URN: ${urn}`);

    let fullProfileData = {};
    let latestPostData = null;

    try {
        await Promise.all([
            (async () => {
                try {
                    const profileDetails = await callLinkedinTool('get_linkedin_profile', { user: urn, with_experience: true, with_education: true, with_skills: true });
                    if (profileDetails) {
                        fullProfileData = profileDetails;
                    }
                } catch (profileError) {
                    console.error(`Could not fetch full profile for ${urn}:`, profileError);
                }
            })(),
            (async () => {
                try {
                    const posts = await callLinkedinTool('get_linkedin_user_posts', { urn: urn, count: 1 });
                    if (posts && posts.length > 0 && posts[0]) {
                        const post = posts[0];
                        latestPostData = {
                            url: post.url,
                            text: post.text ? `${post.text.substring(0, 280)}...` : 'Le post ne contient pas de texte.'
                        };
                    } else {
                        latestPostData = { message: 'Ce prospect n\'a jamais posté sur LinkedIn' };
                    }
                } catch (postError) {
                    console.error(`Could not fetch posts for ${urn}:`, postError);
                    latestPostData = { message: 'Impossible de récupérer les posts pour ce prospect' };
                }
            })()
        ]);

        res.json({ ...fullProfileData, latestPost: latestPostData });

    } catch (error) {
        console.error(`Error fetching details for ${urn}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

app.post('/api/profile', async (req, res) => {
    const { urn } = req.body;
    if (!urn || typeof urn !== 'string') {
        return res.status(400).json({ error: 'Valid user URN is required' });
    }
    console.log(`Fetching profile for URN: ${urn}`);
    try {
        const profileDetails = await callLinkedinTool('get_linkedin_profile', { user: urn, with_experience: true, with_education: true, with_skills: true });
        res.json(profileDetails);
    } catch (error) {
        console.error(`Error fetching profile for ${urn}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

app.post('/api/posts', async (req, res) => {
    const { urn } = req.body;
    if (!urn || typeof urn !== 'string') {
        return res.status(400).json({ error: 'Valid user URN is required' });
    }
    console.log(`Fetching posts for URN: ${urn}`);
    try {
        const posts = await callLinkedinTool('get_linkedin_user_posts', { urn: urn, count: 3 });
        res.json(posts || []);
    } catch (error) {
        console.error(`Error fetching posts for ${urn}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/index.html to use the app.`);
}); 