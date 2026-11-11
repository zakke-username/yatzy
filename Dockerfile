# The client's static files. Export them with: docker build --target client --output type=local,dest=dist .
FROM node:26-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
RUN npm ci -w client
COPY shared shared
COPY client client
RUN npm run build -w client

FROM scratch AS client
COPY --from=client-build /app/client/dist /

FROM node:26-alpine AS server
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --omit=dev -w server && npm cache clean --force
COPY shared shared
COPY server/src server/src
USER node
EXPOSE 3000
CMD ["node", "server/src/index.ts"]
