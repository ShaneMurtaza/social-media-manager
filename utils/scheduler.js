import { query } from '../db.js';

async function publishScheduledPosts() {
    const now = new Date().toISOString();
    
    try {
        const result = await query('SELECT * FROM scheduled_posts WHERE scheduled_for <= $1 AND is_posted = false', [now]);
        
        for (const post of result.rows) {
            try {
                const platforms = typeof post.platforms === 'string' ? 
                                JSON.parse(post.platforms) : post.platforms;
                
                // TODO: Implement posting to each platform using socialPosters.js
                // For now, just mark as posted
                await query('UPDATE scheduled_posts SET is_posted = true, posted_at = NOW() WHERE id = $1', [post.id]);
                console.log(`Successfully published post ${post.id}`);
            } catch (error) {
                console.error(`Failed to publish post ${post.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Scheduler DB Error:', error);
    }
}

export { publishScheduledPosts };