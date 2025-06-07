# Git Cleanup Script for Feriwala E-commerce Store
# This script will remove sensitive files from Git tracking

# WARNING: Run this script only after backing up your uploads folder and database!
# The files will be deleted from Git history but preserved locally

Write-Host "Git Cleanup Script for Feriwala E-commerce Store" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "IMPORTANT: This script will remove sensitive files from Git tracking." -ForegroundColor Red
Write-Host "The following files will be removed from Git but kept locally:" -ForegroundColor Red
Write-Host "  - server/ecommerce.db (database file)" -ForegroundColor Red
Write-Host "  - server/uploads/* (uploaded image files)" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Do you want to continue? Type 'YES' to proceed"

if ($confirmation -eq "YES") {
    Write-Host "Proceeding with cleanup..." -ForegroundColor Green
    
    # Navigate to the project directory
    Set-Location "d:\projects\Feriwala\ecommerce-store"
    
    # Remove database from tracking but keep locally
    Write-Host "Removing database file from Git tracking..."
    git rm --cached server/ecommerce.db
    
    # Remove uploads folder from tracking but keep locally
    Write-Host "Removing uploads folder from Git tracking..."
    git rm -r --cached server/uploads/
    
    # Add the updated .gitignore files
    Write-Host "Adding updated .gitignore files..."
    git add .gitignore
    git add admin/.gitignore
    git add client/.gitignore
    git add server/.gitignore
    
    Write-Host ""
    Write-Host "Cleanup completed!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Review the changes with: git status" -ForegroundColor Yellow
    Write-Host "2. Commit the changes with: git commit -m 'Update .gitignore and remove sensitive files from tracking'" -ForegroundColor Yellow
    Write-Host "3. The database and uploads folder are now ignored by Git but preserved locally" -ForegroundColor Yellow
    
} else {
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
}
