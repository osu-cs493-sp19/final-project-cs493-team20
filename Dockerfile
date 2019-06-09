FROM node:11
WORKDIR /usr/src/app
COPY . .
RUN npm install
ENV PORT=8003
EXPOSE ${PORT}
CMD [ "npm", "start" ]
