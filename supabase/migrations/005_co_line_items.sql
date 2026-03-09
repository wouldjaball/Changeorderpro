-- CO line items: individual T&M items per change order
CREATE TABLE co_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit TEXT DEFAULT 'hours',
  rate DECIMAL(10, 2),
  amount DECIMAL(12, 2),
  item_type TEXT DEFAULT 'labor' CHECK (item_type IN ('labor', 'materials', 'other')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_line_items_co ON co_line_items(change_order_id);

-- Auto-calculate line item amount
CREATE OR REPLACE FUNCTION calc_line_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rate IS NOT NULL AND NEW.quantity IS NOT NULL THEN
    NEW.amount := NEW.quantity * NEW.rate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER line_items_calc_amount
  BEFORE INSERT OR UPDATE ON co_line_items
  FOR EACH ROW EXECUTE FUNCTION calc_line_item_amount();

-- Auto-update CO total_amount when line items change
CREATE OR REPLACE FUNCTION update_co_total()
RETURNS TRIGGER AS $$
DECLARE
  co_id UUID;
  line_total DECIMAL(12, 2);
  fixed DECIMAL(12, 2);
  p_type pricing_type;
BEGIN
  co_id := COALESCE(NEW.change_order_id, OLD.change_order_id);

  SELECT COALESCE(SUM(amount), 0) INTO line_total
  FROM co_line_items WHERE change_order_id = co_id;

  SELECT pricing_type, fixed_amount INTO p_type, fixed
  FROM change_orders WHERE id = co_id;

  UPDATE change_orders SET total_amount = CASE
    WHEN p_type = 'fixed' THEN fixed
    WHEN p_type = 'tm' THEN line_total
    WHEN p_type = 'hybrid' THEN COALESCE(fixed, 0) + line_total
    ELSE line_total
  END
  WHERE id = co_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER line_items_update_co_total
  AFTER INSERT OR UPDATE OR DELETE ON co_line_items
  FOR EACH ROW EXECUTE FUNCTION update_co_total();
