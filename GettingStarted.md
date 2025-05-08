# Project Setup Guide

## 🌍 LocationIQ API Key

### Shared API Key Policy
- **Current Active Key**: Contact [Team Lead Name] to get the shared LocationIQ API key
- **Key Usage**: 
  - Respect the daily/monthly usage limits
  - Report any issues immediately
  - Do not share the key publicly

### If You Need Your Own Key
1. Go to [LocationIQ Website](https://locationiq.com/)
2. Create a free account
3. Generate a new API token
4. Replace `LOCATIONIQ_API_KEY` in `.env`

## 🔐 JWT Secret Generation

#### Node.js Command
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Paste the provided token in the jwt_token option.