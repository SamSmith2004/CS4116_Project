FROM node:22-alpine AS builder

# build-time args required by the app during the Vite/SvelteKit build
ARG DATABASE_URL
ARG ORIGIN
ARG BETTER_AUTH_SECRET

# expose them to the environment for the build step
ENV DATABASE_URL=${DATABASE_URL}
ENV ORIGIN=${ORIGIN}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}


WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
# allow overriding the port via environment; default to 5173 if you'd like
ENV NODE_ENV=production
ENV PORT=5173
EXPOSE 5173
CMD [ "node", "build" ]