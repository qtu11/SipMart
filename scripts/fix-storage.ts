
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

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

async function fixStorage() {
    console.log('🔄 Checking Supabase Storage...');

    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Error listing buckets:', listError);
            return;
        }

        const avatarsBucket = buckets.find(b => b.name === 'avatars');

        if (!avatarsBucket) {
            console.log('⚠️ Bucket "avatars" not found. Creating...');
            const { data, error: createError } = await supabase.storage.createBucket('avatars', {
                public: true,
                fileSizeLimit: 5242880,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (createError) {
                console.error('❌ Error creating bucket "avatars":', createError);
            } else {
                console.log('✅ Bucket "avatars" created successfully');
            }
        } else {
            console.log('✅ Bucket "avatars" exists');
            if (!avatarsBucket.public) {
                console.log('🔄 Updating bucket "avatars" to public...');
                await supabase.storage.updateBucket('avatars', { public: true });
                console.log('✅ Bucket updated to public');
            }
        }

        // Check chat-media bucket
        const chatMediaBucket = buckets.find(b => b.name === 'chat-media');

        if (!chatMediaBucket) {
            console.log('⚠️ Bucket "chat-media" not found. Creating...');
            const { data, error: createError } = await supabase.storage.createBucket('chat-media', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (createError) {
                console.error('❌ Error creating bucket "chat-media":', createError);
            } else {
                console.log('✅ Bucket "chat-media" created successfully');
            }
        } else {
            console.log('✅ Bucket "chat-media" exists');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

fixStorage();
