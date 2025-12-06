# Security Guidelines

## API Keys and Secrets

**IMPORTANT**: Never commit API keys, secrets, or sensitive information to version control.

### Google Maps API Key

The Google Maps API key is stored in the `.env` file which is git-ignored.

1. **Never commit the `.env` file** - It's already in `.gitignore`
2. **Never hardcode API keys** in source code
3. **Never share API keys** in public repositories or pull requests

### What to do if an API key is accidentally committed:

1. **Immediately revoke the key** in Google Cloud Console
2. Generate a new API key
3. Update the `.env` file with the new key
4. If the key was pushed to GitHub, you may need to:
   - Remove it from git history (using `git filter-branch` or BFG Repo-Cleaner)
   - Or regenerate a new key and accept the exposure

### Environment Variables

All sensitive configuration should be stored in `.env` files:
- `.env` - Local development (git-ignored)
- `.env.example` - Template file (safe to commit, no real keys)

## Current Configuration

- ✅ `.env` file is in `.gitignore`
- ✅ API keys are loaded from environment variables only
- ✅ No hardcoded API keys in source code

