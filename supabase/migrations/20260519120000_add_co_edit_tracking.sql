ALTER TABLE change_orders
  ADD COLUMN edit_count INT NOT NULL DEFAULT 0,
  ADD COLUMN last_edited_at TIMESTAMPTZ,
  ADD COLUMN last_edited_by UUID REFERENCES users(id);

CREATE OR REPLACE FUNCTION prevent_edit_after_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('approved', 'void', 'invoiced') THEN
    RAISE EXCEPTION 'Change orders in status % cannot be edited', OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER change_orders_prevent_edit_after_approval
  BEFORE UPDATE ON change_orders
  FOR EACH ROW
  WHEN (OLD.status IN ('approved', 'void', 'invoiced')
    AND NEW.status = OLD.status)
  EXECUTE FUNCTION prevent_edit_after_approval();
