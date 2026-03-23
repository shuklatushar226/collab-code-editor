#!/usr/bin/env bash
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}CollabCode — Local Setup${NC}"
echo "================================"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

check_command() {
  if command -v "$1" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $1 found"
  else
    echo -e "  ✗ $1 not found. Please install it first."
    exit 1
  fi
}

check_command node
check_command npm
check_command docker
check_command docker-compose

NODE_VERSION=$(node --version | cut -d. -f1 | tr -d 'v')
if [[ "$NODE_VERSION" -lt 18 ]]; then
  echo "Node.js 18+ required. Found: $(node --version)"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"

# Copy env file
echo -e "\n${YELLOW}Setting up environment...${NC}"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo -e "  ${GREEN}✓${NC} Created .env from .env.example"
  echo -e "  ${YELLOW}!${NC} Edit .env to set your JWT_SECRET and other credentials"
else
  echo -e "  ${GREEN}✓${NC} .env already exists"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# Start infrastructure
echo -e "\n${YELLOW}Starting Docker services (PostgreSQL + Redis)...${NC}"
docker-compose up -d postgres redis
echo -e "  ${GREEN}✓${NC} Waiting for services to be ready..."
sleep 5

# Check postgres is ready
until docker-compose exec -T postgres pg_isready -U postgres &>/dev/null; do
  echo "  Waiting for PostgreSQL..."
  sleep 2
done
echo -e "  ${GREEN}✓${NC} PostgreSQL ready"

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npm run migrate
echo -e "  ${GREEN}✓${NC} Migrations completed"

# Build executor Docker images
echo -e "\n${YELLOW}Building executor sandbox images...${NC}"
bash scripts/build-executors.sh
echo -e "  ${GREEN}✓${NC} Executor images built"

echo -e "\n${GREEN}${BOLD}Setup complete!${NC}"
echo ""
echo "Start development:"
echo -e "  ${BLUE}npm run dev${NC}        # Start all services"
echo ""
echo "Or start individually:"
echo -e "  ${BLUE}cd server && npm run dev${NC}"
echo -e "  ${BLUE}cd client && npm run dev${NC}"
echo ""
echo "Open: http://localhost:5173"
