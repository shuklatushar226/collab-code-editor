-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(64) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  is_guest BOOLEAN DEFAULT FALSE,
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(9) PRIMARY KEY, -- format: XXXX-XXXX
  name VARCHAR(128) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_interview_mode BOOLEAN DEFAULT FALSE,
  interviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  active_file_id VARCHAR(16),
  interview_question TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(16) PRIMARY KEY,
  room_id VARCHAR(9) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(32) NOT NULL DEFAULT 'javascript',
  content TEXT DEFAULT '',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, name)
);

-- Versions table (version history)
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(9) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  file_id VARCHAR(16) NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  label VARCHAR(128),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room members table
CREATE TABLE IF NOT EXISTS room_members (
  room_id VARCHAR(9) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Execution jobs table
CREATE TABLE IF NOT EXISTS execution_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(9) REFERENCES rooms(id) ON DELETE SET NULL,
  file_id VARCHAR(16) REFERENCES files(id) ON DELETE SET NULL,
  language VARCHAR(32) NOT NULL,
  code TEXT NOT NULL,
  stdin TEXT,
  stdout TEXT,
  stderr TEXT,
  exit_code INTEGER,
  execution_time_ms INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_files_room_id ON files(room_id);
CREATE INDEX IF NOT EXISTS idx_versions_file_id ON versions(file_id);
CREATE INDEX IF NOT EXISTS idx_versions_room_id ON versions(room_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_jobs_room_id ON execution_jobs(room_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
