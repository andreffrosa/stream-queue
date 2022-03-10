FROM node:16.14.0-alpine3.15
WORKDIR /stream-queue

COPY ["package.json", "./"]
RUN ["npm", "install", "--production"]

COPY ["./main.js", "."]

EXPOSE 80/tcp

ENTRYPOINT ["node", "main.js"]
