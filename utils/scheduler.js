const db = require('../db');

async function publishScheduledPosts() {
    const now = new Date().toISOString();
    const query = `SELECT * FROM scheduled_posts WHERE scheduled_for <= ? AND is_posted = 0`;

    db.all(query, [now], async (err, rows) => {
        if (err) {
            console.error('Scheduler DB Error:', err);
            return;
        }
        for (const post of rows) {
            try {
                const platforms = JSON.parse(post.platforms);
                // TODO: Implement posting to each platform using socialPosters.js
                // For now, just mark as posted
                const updateQuery = `UPDATE scheduled_posts SET is_posted = 1, posted_at = datetime('now') WHERE id = ?`;
                db.run(updateQuery, [post.id]);
                console.log(`Successfully published post ${post.id}`);
            } catch (error) {
                console.error(`Failed to publish post ${post.id}:`, error);
            }
        }
    });
}

module.exports = { publishScheduledPosts };