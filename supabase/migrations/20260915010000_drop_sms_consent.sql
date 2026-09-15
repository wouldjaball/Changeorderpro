-- SMS is no longer sent via Twilio (see src/lib/sms.ts) — it's handed off to the
-- contractor's own phone via an sms: link, so the A2P 10DLC consent gate no longer
-- applies.
ALTER TABLE projects
  DROP COLUMN sms_consent,
  DROP COLUMN sms_consent_at;

-- Sends via SMS no longer get a delivery confirmation (no Twilio callback) — we only
-- know the link/message was generated and handed to the contractor's device.
ALTER TABLE notifications_log
  DROP CONSTRAINT notifications_log_status_check,
  ADD CONSTRAINT notifications_log_status_check
    CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked', 'link_generated'));
