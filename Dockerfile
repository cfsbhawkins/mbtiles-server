FROM node:carbon-alpine AS builder
ARG BUILD_VERSION

# Create app directory
RUN mkdir -p /app
RUN mkdir -p /app/tiles
WORKDIR /app

# Bundle app source
COPY . /app/

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose ports
EXPOSE 3000

VOLUME ["/app/tiles"]

# Run when container launches
CMD [ "node", "index.js" ]