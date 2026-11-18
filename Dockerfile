FROM node:22-alpine
WORKDIR /app

# Copy application source & static assets
COPY package.json ./
COPY index.html server.js render.yaml ./
COPY css ./css
COPY js ./js
COPY assets ./assets
COPY data ./data

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT||3000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "start"]
