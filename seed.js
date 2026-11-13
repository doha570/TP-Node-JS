const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const POSTS_FILE = path.join(__dirname, 'posts.json');

function savePosts(posts) {
    fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8', error => {
        if (error) {
            console.error('Impossible de sauvegarder les posts :', error.message);
            process.exitCode = 1;
            return;
        }

        console.log(`${posts.length} posts sauvegardés dans ${POSTS_FILE}`);
    });
}

function fetchPosts() {
    https.get(API_URL, response => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', chunk => {
            body += chunk;
        });
        response.on('end', () => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                console.error(`L'API a répondu avec le statut ${response.statusCode}`);
                process.exitCode = 1;
                return;
            }

            try {
                const posts = JSON.parse(body);
                if (!Array.isArray(posts)) {
                    throw new Error('La réponse de l’API n’est pas une liste de posts');
                }
                savePosts(posts);
            } catch (error) {
                console.error('Impossible de lire la réponse de l’API :', error.message);
                process.exitCode = 1;
            }
        });
    }).on('error', error => {
        console.error('Impossible de récupérer les posts :', error.message);
        process.exitCode = 1;
    });
}

fetchPosts();
