-- Notifications log: every SMS/email sent with delivery status
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID REFERENCES change_orders(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  recipient TEXT NOT NULL,
  template_type TEXT,
  external_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_co ON notifications_log(change_order_id);
CREATE INDEX idx_notifications_company ON notifications_log(company_id);
CREATE INDEX idx_notifications_external_id ON notifications_log(external_id) WHERE external_id IS NOT NULL;
