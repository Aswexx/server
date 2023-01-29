FROM node:16 as dev

WORKDIR /user/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY ./build ./build
COPY ./prisma ./prisma

RUN npx prisma generate

USER node

CMD ["node", "./build/server.js"]

# ------------------------------------
# FROM node:16 as prod

# # ARG NODE_ENV=production
# # ENV NODE_ENV=${NODE_ENV}

# WORKDIR /user/src/app

# COPY package*.json .
# RUN npm install --only=production

# COPY --from=dev /user/src/app/build ./build
# COPY --from=dev /user/src/app/prisma ./prisma
# COPY --from=dev /user/src/app/src ./src
# COPY --from=dev /user/src/app/.env ./.env

# RUN npx prisma generate

# USER node

# CMD ["node", "./build/server.js"]
