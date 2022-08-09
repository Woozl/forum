FROM node:16

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm i

COPY . .

RUN npm run build

ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "dist/index.js" ]