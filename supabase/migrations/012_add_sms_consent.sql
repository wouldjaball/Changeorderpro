-- Add SMS consent tracking to projects for A2P 10DLC compliance
ALTER TABLE projects
  ADD COLUMN sms_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN sms_consent_at timestamptz;
