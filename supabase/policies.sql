-- Row Level Security Policies for CupSipSmart

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public can read user profiles (for leaderboard, etc)"
  ON users FOR SELECT
  USING (true);

-- Cups policies
CREATE POLICY "Authenticated users can read cups"
  ON cups FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert/update cups"
  ON cups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- Transactions policies
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Stores policies
CREATE POLICY "Authenticated users can read stores"
  ON stores FOR SELECT
  USING (auth.role() = 'authenticated');

-- Green Feed Posts policies
CREATE POLICY "Anyone can read feed posts"
  ON green_feed_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create feed posts"
  ON green_feed_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own feed posts"
  ON green_feed_posts FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own feed posts"
  ON green_feed_posts FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Comments policies
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = user_id::text);

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Note: These policies assume Firebase Auth UID is stored as text
-- If using Supabase Auth, adjust auth.uid() accordingly

