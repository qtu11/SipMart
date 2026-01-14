
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixContent() {
    console.log('🔄 Checking for legacy brand name "CupSipSmart" in database...');

    // 1. Check Green Feed Posts
    const { data: posts, error: postError } = await supabase
        .from('green_feed_posts')
        .select('post_id, caption, display_name')
        .or('caption.ilike.%CupSipSmart%,display_name.ilike.%CupSipSmart%');

    if (postError) {
        console.error('❌ Error fetching posts:', postError);
    } else if (posts && posts.length > 0) {
        console.log(`📝 Found ${posts.length} posts with legacy branding.`);

        for (const post of posts) {
            let updates: any = {};
            if (post.caption && post.caption.includes('CupSipSmart')) {
                updates.caption = post.caption.replace(/CupSipSmart/g, 'SipSmart');
            }
            if (post.display_name && post.display_name.includes('CupSipSmart')) {
                updates.display_name = post.display_name.replace(/CupSipSmart/g, 'SipSmart');
            }

            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                    .from('green_feed_posts')
                    .update(updates)
                    .eq('post_id', post.post_id);

                if (updateError) console.error(`Failed to update post ${post.post_id}:`, updateError);
                else console.log(`✅ Updated post ${post.post_id}`);
            }
        }
    } else {
        console.log('✅ No legacy branding found in feed posts.');
    }

    // 2. Check Comments
    const { data: comments, error: commentError } = await supabase
        .from('comments')
        .select('comment_id, content')
        .ilike('content', '%CupSipSmart%');

    if (commentError) {
        console.error('❌ Error fetching comments:', commentError);
    } else if (comments && comments.length > 0) {
        console.log(`💬 Found ${comments.length} comments with legacy branding.`);
        for (const comment of comments) {
            const newContent = comment.content.replace(/CupSipSmart/g, 'SipSmart');
            await supabase
                .from('comments')
                .update({ content: newContent })
                .eq('comment_id', comment.comment_id);
            console.log(`✅ Updated comment ${comment.comment_id}`);
        }
    } else {
        console.log('✅ No legacy branding found in comments.');
    }

    // 3. Update User Display Names (Optional but good safety)
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('user_id, display_name')
        .ilike('display_name', '%CupSipSmart%');

    if (users && users.length > 0) {
        console.log(`👤 Found ${users.length} users with legacy branding in name.`);
        for (const user of users) {
            const newName = user.display_name.replace(/CupSipSmart/g, 'SipSmart');
            await supabase
                .from('users')
                .update({ display_name: newName })
                .eq('user_id', user.user_id);
            console.log(`✅ Updated user ${user.user_id}`);
        }
    }
}

fixContent();
