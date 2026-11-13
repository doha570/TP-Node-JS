const http = require('http');
const url = require('url');
const postManager = require('./postManager');

const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_SIZE = 1024 * 1024;

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode);
    response.end(JSON.stringify(data));
}

function parseJsonBody(request, callback) {
    let body = '';
    let tooLarge = false;

    request.on('data', chunk => {
        body += chunk.toString();
        if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
            tooLarge = true;
            request.destroy();
        }
    });
    request.on('end', () => {
        if (tooLarge) {
            callback(Object.assign(new Error('Le corps de la requête est trop volumineux.'), { statusCode: 413 }));
            return;
        }

        try {
            const data = JSON.parse(body);
            if (!data || Array.isArray(data) || typeof data !== 'object') {
                throw new Error('Le corps JSON doit être un objet.');
            }
            callback(null, data);
        } catch (error) {
            callback(Object.assign(error, { statusCode: 400 }));
        }
    });
}

function isValidPost(post) {
    const userId = Number(post && post.userId);
    return post
        && Number.isSafeInteger(userId)
        && userId > 0
        && String(post.title || '').trim().length > 0
        && String(post.body || '').trim().length > 0;
}

const server = http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    const method = request.method;

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }

    if (pathname === '/api/posts' && method === 'GET') {
        postManager.getAllPosts((error, posts) => {
            if (error) {
                sendJson(response, 500, { error: 'Impossible de lire les posts.' });
                return;
            }
            sendJson(response, 200, posts);
        });
        return;
    }

    if (pathname === '/api/posts' && method === 'POST') {
        parseJsonBody(request, (error, post) => {
            if (error) {
                sendJson(response, error.statusCode || 400, { error: error.message });
                return;
            }
            if (!isValidPost(post)) {
                sendJson(response, 400, { error: 'userId, title et body sont obligatoires et doivent être valides.' });
                return;
            }

            postManager.insertPost({
                userId: Number(post.userId),
                title: String(post.title).trim(),
                body: String(post.body).trim()
            }, (saveError, createdPost) => {
                if (saveError) {
                    sendJson(response, 500, { error: 'Impossible de sauvegarder le post.' });
                    return;
                }
                sendJson(response, 201, createdPost);
            });
        });
        return;
    }

    const postMatch = pathname.match(/^\/api\/posts\/([^/]+)$/);
    if (postMatch) {
        const id = Number(postMatch[1]);
        if (!Number.isSafeInteger(id) || id < 1) {
            sendJson(response, 400, { error: 'ID de post invalide.' });
            return;
        }

        if (method === 'GET') {
            postManager.getPost(id, (error, post) => {
                if (error) {
                    sendJson(response, 500, { error: 'Impossible de lire le post.' });
                    return;
                }
                if (!post) {
                    sendJson(response, 404, { error: 'Post non trouvé.' });
                    return;
                }
                sendJson(response, 200, post);
            });
            return;
        }

        if (method === 'PUT') {
            parseJsonBody(request, (error, post) => {
                if (error) {
                    sendJson(response, error.statusCode || 400, { error: error.message });
                    return;
                }
                if (!isValidPost(post)) {
                    sendJson(response, 400, { error: 'userId, title et body sont obligatoires et doivent être valides.' });
                    return;
                }

                postManager.updatePost(id, {
                    userId: Number(post.userId),
                    title: String(post.title).trim(),
                    body: String(post.body).trim()
                }, (updateError, updatedPost) => {
                    if (updateError) {
                        sendJson(response, 500, { error: 'Impossible de sauvegarder le post.' });
                        return;
                    }
                    if (!updatedPost) {
                        sendJson(response, 404, { error: 'Post non trouvé.' });
                        return;
                    }
                    sendJson(response, 200, updatedPost);
                });
            });
            return;
        }

        if (method === 'DELETE') {
            postManager.deletePost(id, (error, deletedPost) => {
                if (error) {
                    sendJson(response, 500, { error: 'Impossible de supprimer le post.' });
                    return;
                }
                if (!deletedPost) {
                    sendJson(response, 404, { error: 'Post non trouvé.' });
                    return;
                }
                sendJson(response, 200, deletedPost);
            });
            return;
        }
    }

    sendJson(response, 404, { error: 'Route non trouvée.' });
});

server.listen(PORT, () => {
    console.log(`Serveur API démarré sur http://localhost:${PORT}`);
    console.log('Routes : GET/POST /api/posts, GET/PUT/DELETE /api/posts/:id');
});
