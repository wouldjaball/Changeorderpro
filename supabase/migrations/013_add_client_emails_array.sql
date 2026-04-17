ALTER TABLE projects
  ADD COLUMN client_emails TEXT[] NOT NULL DEFAULT '{}';
