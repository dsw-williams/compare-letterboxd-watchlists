FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install Playwright's Chromium browser
RUN npx playwright install chromium

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Create data directory for persistent storage
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]