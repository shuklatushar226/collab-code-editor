#!/usr/bin/env bash
set -euo pipefail

echo "Seeding database with sample data..."

PGPASSWORD=${DB_PASSWORD:-postgres} psql \
  -h ${DB_HOST:-localhost} \
  -U ${DB_USER:-postgres} \
  -d ${DB_NAME:-collab_editor} << 'EOF'

-- Insert demo user
INSERT INTO users (id, name, email, is_guest) VALUES
  ('demo-user-001', 'Demo User', 'demo@example.com', false)
ON CONFLICT DO NOTHING;

-- Insert demo room
INSERT INTO rooms (id, name, created_by) VALUES
  ('DEMO-0001', 'Demo Room', 'demo-user-001')
ON CONFLICT DO NOTHING;

-- Insert demo file
INSERT INTO files (id, room_id, name, language, content) VALUES
  ('demo-file-001', 'DEMO-0001', 'hello.js', 'javascript',
   '// Welcome to CollabCode!
// Edit this file collaboratively with multiple users.

function greet(name) {
  return `Hello, ${name}! Welcome to real-time collaborative coding.`;
}

console.log(greet("World"));

// Try running this code with the Run button above!
')
ON CONFLICT DO NOTHING;

SELECT 'Demo data seeded successfully' AS status;
EOF
