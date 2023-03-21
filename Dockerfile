FROM node:16 as dev

WORKDIR /user/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY ./build ./build
COPY ./prisma ./prisma
COPY ./logs ./logs

RUN npx prisma generate

USER node

CMD ["node", "./build/server.js"]