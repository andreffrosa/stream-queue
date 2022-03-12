FROM node:16.14.0-alpine3.15
WORKDIR /tester

COPY ["package.json", "./"]
RUN ["npm", "install"]

COPY ["./main.js", "."]

CMD ["node", "main.js"]
