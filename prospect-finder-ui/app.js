document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const locationInput = document.getElementById('location');
    const keywordsInput = document.getElementById('keywords');
    const resultsContainer = document.getElementById('results');
    const loadingIndicator = document.getElementById('loading');

    searchButton.addEventListener('click', async () => {
        const searchParams = {
            first_name: firstNameInput.value || undefined,
            last_name: lastNameInput.value || undefined,
            location: locationInput.value || undefined,
            keywords: keywordsInput.value || undefined,
        };

        resultsContainer.innerHTML = '';
        loadingIndicator.style.display = 'block';

        try {
            const response = await fetch('http://localhost:3000/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const results = await response.json();
            displayResults(results);

        } catch (error) {
            console.error('Error during search:', error);
            resultsContainer.innerHTML = `<p class="error">Une erreur est survenue: ${error.message}</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });

    function displayResults(results) {
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<p>Aucun résultat trouvé.</p>';
            return;
        }

        const list = document.createElement('ul');
        list.className = 'results-list';

        results.forEach(profile => {
            const item = document.createElement('li');
            item.className = 'result-item';
            item.id = `profile-${profile.urn.value}`; // Unique ID for the item

            const urnString = `fsd_profile:${profile.urn.value}`;

            let profileHTML = `
                <div class="profile-header">
                    <h3>${profile.name || 'Nom non disponible'}</h3>
                    <p>${profile.headline || 'Titre non disponible'}</p>
                </div>
                <div class="profile-details">
                     <p><strong>Lieu:</strong> ${profile.location || 'N/A'}</p>
                </div>
                <div class="profile-actions">
                    <button class="profile-button" data-urn="${urnString}">Voir le profil</button>
                    <button class="posts-button" data-urn="${urnString}">Voir les 3 derniers posts</button>
                </div>
                <div class="profile-details-info" style="display: none;"></div>
                <div class="profile-posts-info" style="display: none;"></div>
            `;
            item.innerHTML = profileHTML;
            list.appendChild(item);
        });

        resultsContainer.appendChild(list);

        // Add event listeners for profile buttons
        document.querySelectorAll('.profile-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const button = event.target;
                const urn = button.dataset.urn;
                const container = button.closest('.result-item').querySelector('.profile-details-info');
                
                button.disabled = true;
                container.style.display = 'block';
                container.innerHTML = '<p>Chargement du profil...</p>';

                try {
                    const response = await fetch('http://localhost:3000/api/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ urn })
                    });
                    if (!response.ok) throw new Error('Failed to fetch profile.');
                    
                    const results = await response.json();
                    if (!results || !Array.isArray(results) || results.length === 0) {
                        throw new Error('Profile data is empty or in an unexpected format.');
                    }
                    const details = results[0]; // The API returns an array with one profile
                    console.log('Données de profil reçues:', JSON.stringify(details, null, 2));
                    
                    container.innerHTML = `
                        <div class="profile-main-info">
                            <img src="${details.image}" alt="Photo de profil" class="profile-pic">
                            <div>
                                <p><strong>Email:</strong> ${details.email || 'N/A'}</p>
                                <p><strong>Followers:</strong> ${details.follower_count || 'N/A'}</p>
                                ${details.websites && details.websites.length > 0 ? `<p><strong>Sites web:</strong> ${details.websites.map(w => `<a href="${w.url}" target="_blank">${w.url}</a>`).join(', ')}</p>` : ''}
                            </div>
                        </div>

                        ${details.description ? `<h4>Description</h4><p class="description-text">${details.description}</p>`: ''}

                        ${details.top_skills && details.top_skills.length > 0 ? `<h4>Top Compétences</h4><p class="skills-list">${details.top_skills.join(', ')}</p>` : ''}

                        ${details.experience && details.experience.length > 0 ? `
                            <h4>Expérience</h4>
                            <ul class="details-list">
                                ${details.experience.map(exp => `
                                    <li>
                                        <strong>${exp.position || ''}</strong> chez <a href="${exp.company.url}" target="_blank">${exp.company.name || ''}</a>
                                        <p class="date-location">${exp.interval || ''} (${exp.period || ''}) · ${exp.location || ''}</p>
                                        <p class="description-text-small">${exp.description || ''}</p>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}

                        ${details.education && details.education.length > 0 ? `
                            <h4>Formation</h4>
                            <ul class="details-list">
                                ${details.education.map(edu => `
                                    <li>
                                        <strong>${edu.company.name || ''}</strong>
                                        <p>${edu.major || ''} · ${edu.interval || ''}</p>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}

                        ${details.certificates && details.certificates.length > 0 ? `
                            <h4>Certifications</h4>
                            <ul class="details-list">
                                ${details.certificates.map(cert => `
                                    <li>
                                        <a href="${cert.url}" target="_blank">${cert.name}</a>
                                        <p class="date-location">${cert.company.name || ''} · ${cert.created_at || ''}</p>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}
                    `;
                } catch (error) {
                    container.innerHTML = `<p class="error">Erreur: ${error.message}</p>`;
                    button.disabled = false;
                }
            });
        });

        // Add event listeners for posts buttons
        document.querySelectorAll('.posts-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const button = event.target;
                const urn = button.dataset.urn;
                const container = button.closest('.result-item').querySelector('.profile-posts-info');

                button.disabled = true;
                container.style.display = 'block';
                container.innerHTML = '<p>Chargement des posts...</p>';

                try {
                    const response = await fetch('http://localhost:3000/api/posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ urn })
                    });
                    if (!response.ok) throw new Error('Failed to fetch posts.');
                    const posts = await response.json();

                    if (posts.length > 0) {
                        container.innerHTML = posts.map(post => `
                            <div class="profile-latest-post">
                                <p class="post-text">${post.text ? post.text.substring(0, 280) + '...' : 'Pas de texte.'}</p>
                                <p><a href="${post.url}" target="_blank">Voir le post complet</a></p>
                            </div>
                        `).join('');
                    } else {
                        container.innerHTML = '<p>Aucun post trouvé.</p>';
                    }
                } catch (error) {
                    container.innerHTML = `<p class="error">Erreur: ${error.message}</p>`;
                    button.disabled = false;
                }
            });
        });
    }

    // Add some styles for the new elements
    const style = document.createElement('style');
    style.textContent = `
        .error { color: #d93025; }
        .results-list { list-style-type: none; padding: 0; }
        .result-item { background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 10px; }
        .profile-header h3 { margin: 0 0 5px 0; color: #1c1e21; }
        .profile-header p { margin: 0 0 10px 0; font-size: 14px; color: #606770; }
        .profile-header a { color: #1877f2; text-decoration: none; }
        .profile-header a:hover { text-decoration: underline; }
        .profile-details p { margin: 5px 0; font-size: 14px; }
        .profile-details h4 { margin: 15px 0 5px 0; color: #333; }
        .details-list { list-style-position: inside; padding-left: 0; margin-top: 0; }
        .details-list li { margin-bottom: 5px; }
        .skills-list { font-style: italic; }
        .profile-latest-post { margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; }
        .post-text { font-style: italic; color: #333; background-color: #f0f2f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
        .profile-actions { margin-top: 15px; display: flex; gap: 10px; }
        .profile-button, .posts-button { background-color: #1877f2; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
        .profile-button:hover, .posts-button:hover { background-color: #166fe5; }
        .profile-button:disabled, .posts-button:disabled { background-color: #a0a0a0; cursor: not-allowed; }
        .profile-pic { width: 80px; height: 80px; border-radius: 50%; margin-right: 15px; }
        .profile-main-info { display: flex; align-items: center; margin-bottom: 15px; }
        .description-text { white-space: pre-wrap; word-wrap: break-word; font-size: 0.95em; }
        .description-text-small { white-space: pre-wrap; word-wrap: break-word; font-size: 0.9em; color: #333; background-color: #f8f8f8; padding: 8px; border-radius: 4px; margin-top: 5px; }
        .date-location { font-size: 0.9em; color: #606770; }
    `;
    document.head.appendChild(style);
}); 