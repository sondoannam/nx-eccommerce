#!/bin/bash

# Run Prisma migrations in development
echo "Running Prisma migrations in development mode..."

# Initialize Prisma if needed (creates migration directory)
pnpx prisma init --skip-generate

# Save current migrations to make sure we don't lose any work
echo "Creating initial migration..."
pnpx prisma migrate dev --name init --create-only

# Generate Prisma client
echo "Generating Prisma client..."
pnpx prisma generate

echo "Migration script completed!"
