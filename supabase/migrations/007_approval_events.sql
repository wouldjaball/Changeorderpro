-- Approval events: immutable audit log of all approval actions
CREATE TABLE approval_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'declined', 'viewed', 'reminder_sent')),
  method TEXT CHECK (method IN ('sms', 'email', 'link')),
  ip_address INET,
  user_agent TEXT,
  client_name_typed TEXT,
  phone_number_hash TEXT,
  twilio_message_sid TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_events_co ON approval_events(change_order_id);
CREATE INDEX idx_approval_events_company ON approval_events(company_id);

-- IMMUTABILITY: Prevent updates and deletes on approval_events
CREATE OR REPLACE FUNCTION prevent_approval_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Approval events are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_events_immutable_update
  BEFORE UPDATE ON approval_events
  FOR EACH ROW EXECUTE FUNCTION prevent_approval_event_modification();

CREATE TRIGGER approval_events_immutable_delete
  BEFORE DELETE ON approval_events
  FOR EACH ROW EXECUTE FUNCTION prevent_approval_event_modification();
