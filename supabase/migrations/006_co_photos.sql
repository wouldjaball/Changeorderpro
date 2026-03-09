-- CO photos: attachments stored in Supabase Storage
CREATE TABLE co_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  annotated_url TEXT,
  file_name TEXT,
  file_size INT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_co ON co_photos(change_order_id);
