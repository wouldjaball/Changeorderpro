-- Add "paid" and "archived" as change order statuses so a CO can be marked
-- paid after invoicing, or archived to hide it from active workflows.
ALTER TYPE co_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE co_status ADD VALUE IF NOT EXISTS 'archived';

ALTER TABLE change_orders
  ADD COLUMN paid_at TIMESTAMPTZ,
  ADD COLUMN archived_at TIMESTAMPTZ;
