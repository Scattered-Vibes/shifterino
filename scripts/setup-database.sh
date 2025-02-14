#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Database Setup ===${NC}"

# Reset the database (this will run migrations and seed)
echo -e "${BLUE}Running supabase db reset...${NC}"
supabase db reset

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to reset database${NC}"
    exit 1
fi

echo -e "${GREEN}Database reset successful${NC}"

# Create test users
echo -e "${BLUE}Creating test users...${NC}"
npx tsx scripts/create-test-users.ts

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create test users${NC}"
    exit 1
fi

echo -e "${GREEN}Test users created successfully${NC}"

echo -e "${BLUE}=== Database Setup Complete ===${NC}" 