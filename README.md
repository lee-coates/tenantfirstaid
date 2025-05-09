# Tenant First Aid

A chatbot that provides legal advice related to housing and eviction

## Local Development

1. cd backend
2. brew install uv
3. uv sync
4. uv run python -m tenantfirstaid.app
4. (in another terminal) cd ../frontend
5. npm install
6. npm run dev
7. Go to http://localhost:5173
8. Start chatting

## Remote server setup
On DO, we:
1. added our ssh public keys
2. install nginx
3. Kent got the tls cert (just ask chatgpt?)

