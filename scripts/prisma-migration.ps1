# Run Prisma migrations in development
Write-Host "Running Prisma migrations in development mode..." -ForegroundColor Green

# Initialize Prisma if needed (creates migration directory)
Write-Host "Initializing Prisma if needed..." -ForegroundColor Yellow
pnpx prisma init --skip-generate

# Save current migrations
Write-Host "Creating initial migration..." -ForegroundColor Yellow
pnpx prisma migrate dev --name init --create-only

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
pnpx prisma generate

Write-Host "Migration script completed!" -ForegroundColor Green
