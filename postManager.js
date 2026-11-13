const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, 'posts.json');

function getAllPosts(callback) {
    fs.readFile(POSTS_FILE, 'utf8', (error, data) => {
        if (error) {
            callback(error);
            return;
        }

        try {
            const posts = JSON.parse(data);
            if (!Array.isArray(posts)) {
                throw new Error('Le fichier posts.json doit contenir une liste.');
            }
            callback(null, posts);
        } catch (parseError) {
            callback(parseError);
        }
    });
}

function getPost(id, callback) {
    getAllPosts((error, posts) => {
        if (error) {
            callback(error);
            return;
        }
        callback(null, posts.find(post => Number(post.id) === id) || null);
    });
}

function insertPost(newPost, callback) {
    getAllPosts((error, posts) => {
        if (error) {
            callback(error);
            return;
        }

        const nextId = posts.reduce((maximum, post) => Math.max(maximum, Number(post.id) || 0), 0) + 1;
        const post = { id: nextId, ...newPost };
        posts.push(post);
        savePosts(posts, saveError => callback(saveError, saveError ? undefined : post));
    });
}

function updatePost(id, updatedPost, callback) {
    getAllPosts((error, posts) => {
        if (error) {
            callback(error);
            return;
        }

        const index = posts.findIndex(post => Number(post.id) === id);
        if (index === -1) {
            callback(null, null);
            return;
        }

        posts[index] = { ...posts[index], ...updatedPost, id };
        savePosts(posts, saveError => callback(saveError, saveError ? undefined : posts[index]));
    });
}

function deletePost(id, callback) {
    getAllPosts((error, posts) => {
        if (error) {
            callback(error);
            return;
        }

        const index = posts.findIndex(post => Number(post.id) === id);
        if (index === -1) {
            callback(null, null);
            return;
        }

        const deletedPost = posts.splice(index, 1)[0];
        savePosts(posts, saveError => callback(saveError, saveError ? undefined : deletedPost));
    });
}

function savePosts(posts, callback) {
    fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8', callback);
}

module.exports = {
    getAllPosts,
    getPost,
    insertPost,
    updatePost,
    deletePost
};
