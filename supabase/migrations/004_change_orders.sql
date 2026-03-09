-- Change order status and pricing type enums
CREATE TYPE co_status AS ENUM ('draft', 'sent', 'approved', 'declined', 'void', 'invoiced');
CREATE TYPE pricing_type AS ENUM ('fixed', 'tm', 'hybrid');

-- Change orders: the core record
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pricing_type pricing_type NOT NULL DEFAULT 'fixed',
  fixed_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  status co_status DEFAULT 'draft',
  approval_method TEXT CHECK (approval_method IN ('sms', 'email', 'link', 'both')),
  approval_token TEXT UNIQUE,
  approval_token_expires_at TIMESTAMPTZ,
  internal_notes TEXT,
  start_date DATE,
  completion_date DATE,
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_co_company_status ON change_orders(company_id, status);
CREATE INDEX idx_co_project ON change_orders(project_id);
CREATE INDEX idx_co_approval_token ON change_orders(approval_token) WHERE approval_token IS NOT NULL;
CREATE UNIQUE INDEX idx_co_number_company ON change_orders(company_id, co_number);

CREATE TRIGGER change_orders_updated_at
  BEFORE UPDATE ON change_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-generate CO number
CREATE OR REPLACE FUNCTION generate_co_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  seq_start INT;
  next_num INT;
  co_num TEXT;
BEGIN
  SELECT
    COALESCE(settings->>'co_prefix', 'CO'),
    COALESCE((settings->>'co_sequence_start')::INT, 1)
  INTO prefix, seq_start
  FROM companies WHERE id = p_company_id;

  SELECT COALESCE(MAX(
    CASE
      WHEN co_number ~ ('^' || prefix || '-[0-9]+$')
      THEN (regexp_replace(co_number, '^' || prefix || '-', ''))::INT
      ELSE 0
    END
  ), seq_start - 1) + 1
  INTO next_num
  FROM change_orders WHERE company_id = p_company_id;

  co_num := prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN co_num;
END;
$$ LANGUAGE plpgsql;
