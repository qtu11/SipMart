-- Migration 020: Add User Trees Table
-- Replaces legacy Firebase implementation for the Tree Watering Game

CREATE TABLE IF NOT EXISTS user_trees (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  growth INTEGER DEFAULT 0 CHECK (growth >= 0 AND growth <= 100),
  health TEXT DEFAULT 'healthy' CHECK (health IN ('healthy', 'wilting', 'dead')),
  last_watered TIMESTAMPTZ DEFAULT NOW(),
  total_waterings INTEGER DEFAULT 0 CHECK (total_waterings >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboard or stats
CREATE INDEX IF NOT EXISTS idx_user_trees_level ON user_trees(level DESC, growth DESC);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_user_trees_updated_at ON user_trees;
CREATE TRIGGER update_user_trees_updated_at
  BEFORE UPDATE ON user_trees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_trees ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own tree" ON user_trees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tree" ON user_trees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tree" ON user_trees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view high level trees" ON user_trees
  FOR SELECT USING (true); -- Allow leaderboard viewing
