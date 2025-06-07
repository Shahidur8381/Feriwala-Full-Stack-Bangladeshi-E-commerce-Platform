# .gitignore Configuration for Feriwala E-commerce Store

This document explains the .gitignore configuration for the Feriwala e-commerce project.

## Project Structure

The project has .gitignore files in the following locations:

```
ecommerce-store/
├── .gitignore              # Root-level ignores
├── admin/.gitignore        # Admin panel (React + Vite)
├── client/.gitignore       # Client frontend (Next.js)
└── server/.gitignore       # Backend server (Node.js + Express)
```

## Important Files Being Ignored

### Root Level (.gitignore)

- `node_modules/` - Dependencies
- Environment files (`.env*`)
- OS-specific files (`.DS_Store`, `Thumbs.db`)
- Editor configurations
- Log files
- Test files

### Server (/server/.gitignore)

- `ecommerce.db` - SQLite database file
- `uploads/` - User uploaded images and files
- Environment variables
- Log files
- PM2 process files
- Cache files

### Client (/client/.gitignore)

- `.next/` - Next.js build output
- `out/` - Static export output
- Environment variables
- Vercel deployment files
- TypeScript cache
- PWA files

### Admin (/admin/.gitignore)

- `dist/` - Vite build output
- `.vite/` - Vite cache
- Environment variables
- Storybook build files

## Security Considerations

The following sensitive files are ignored for security reasons:

1. **Database Files**: `ecommerce.db` contains user data and should not be in version control
2. **Uploads Folder**: Contains user-uploaded images that may be sensitive
3. **Environment Files**: Contain API keys, secrets, and configuration
4. **SSL Certificates**: Any `.pem`, `.key`, `.crt` files

## If Files Were Already Tracked

If sensitive files were already committed to Git, run the cleanup script:

```powershell
# Navigate to project root
cd "d:\projects\Feriwala\ecommerce-store"

# Run the cleanup script
.\cleanup-git.ps1
```

This script will:

- Remove `server/ecommerce.db` from Git tracking
- Remove `server/uploads/` from Git tracking
- Keep the files locally
- Update .gitignore files

## Development Workflow

After setting up .gitignore:

1. **New files**: Will be automatically ignored if they match patterns
2. **Environment setup**: Copy `.env.example` to `.env.local` and configure
3. **Database**: Will be created locally and ignored by Git
4. **Uploads**: New uploads will be stored locally and ignored

## Backup Recommendations

Since important files are ignored by Git:

1. **Database**: Regularly backup `server/ecommerce.db`
2. **Uploads**: Backup `server/uploads/` folder
3. **Environment**: Document environment variables securely

## Team Development

When setting up the project on a new machine:

1. Clone the repository
2. Install dependencies in each folder
3. Set up environment variables
4. Create/import database as needed
5. The uploads folder will be empty initially

## Customization

To modify what's ignored:

1. Edit the appropriate `.gitignore` file
2. Use `git add -f <file>` to force-add ignored files if needed
3. Use `git rm --cached <file>` to stop tracking files without deleting them

## Common Patterns

```gitignore
# Ignore all files with extension
*.log

# Ignore folder
node_modules/

# Ignore file
config.secret.js

# Don't ignore specific file in ignored folder
!.vscode/extensions.json

# Ignore all files in folder but keep folder structure
uploads/*
!uploads/.gitkeep
```
