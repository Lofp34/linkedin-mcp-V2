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
            
            let profileHTML = `
                <div class="profile-header">
                    <h3>${profile.name || 'Nom non disponible'}</h3>
                    <p>${profile.headline || 'Titre non disponible'}</p>
                    <p><a href="${profile.url}" target="_blank">Voir sur LinkedIn</a></p>
                </div>
                <div class="profile-details">
                    <p><strong>Lieu:</strong> ${profile.location || 'N/A'}</p>
                </div>
            `;
            item.innerHTML = profileHTML;
            list.appendChild(item);
        });

        resultsContainer.appendChild(list);
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
    `;
    document.head.appendChild(style);
}); 