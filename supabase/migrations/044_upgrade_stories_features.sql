-- Migration: 044_upgrade_stories_features.sql
-- Description: Adds tables for story reactions and comments to support Facebook-like features.

-- 1. Create Story Reactions Table
CREATE TABLE IF NOT EXISTS story_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id) -- One reaction per user per story
);

-- 2. Create Story Comments Table
CREATE TABLE IF NOT EXISTS story_comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure Story Views Table exists (if not created by previous migrations)
CREATE TABLE IF NOT EXISTS story_views (
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- 4. Enable RLS
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Reactions
CREATE POLICY "Everyone can view reactions" ON story_reactions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react" ON story_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON story_reactions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON story_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Policies for Comments
CREATE POLICY "Everyone can view comments" ON story_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON story_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit their own comments" ON story_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON story_comments
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Policies for Views
CREATE POLICY "Users can view who viewed their stories" ON story_views
    FOR SELECT USING (
        -- User can see who viewed their OWN stories
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.story_id = story_views.story_id
            AND stories.user_id = auth.uid()
        )
        OR
        -- User can see their OWN views
        auth.uid() = user_id
    );

CREATE POLICY "Authenticated users can record view" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Add useful indexes
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
