-- ============================================================
-- Farmer Scheme Portal - Database Schema
-- Run this on your PostgreSQL instance
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- USERS / FARMERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  aadhaar_last4 VARCHAR(4),             -- store only last 4 digits
  state         VARCHAR(100),
  district      VARCHAR(100),
  village       VARCHAR(100),
  land_area_acres DECIMAL(10,2),
  role          VARCHAR(20) DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- DOCUMENTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type      VARCHAR(100) NOT NULL,  -- e.g. 'land_record', 'aadhaar', 'bank_passbook'
  file_name     VARCHAR(255) NOT NULL,
  file_path     VARCHAR(500) NOT NULL,
  file_size     INTEGER,               -- bytes
  mime_type     VARCHAR(100),
  status        VARCHAR(30) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'ocr_done', 'verified', 'rejected')),
  ocr_text      TEXT,                  -- extracted text from OCR service
  ocr_data      JSONB,                 -- structured OCR output
  admin_remarks TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW(),
  processed_at  TIMESTAMPTZ,
  verified_at   TIMESTAMPTZ
);

-- -------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(30) DEFAULT 'info'
                CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read     BOOLEAN DEFAULT false,
  link        VARCHAR(500),            -- optional deep link
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- REFRESH TOKENS (for JWT rotation)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- -------------------------------------------------------
-- UPDATED_AT TRIGGER
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();