# One image for every process of the platform: the command picks the role (broker, region, service, web).
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The web app in live mode (talks to the regional APIs published on this machine).
RUN npx vite build --mode live
ENV DATA_DIR=/data NODE_OPTIONS=--disable-warning=ExperimentalWarning
CMD ["node", "server/region.js"]
