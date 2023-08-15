FROM --platform=$TARGETPLATFORM node:lts-bullseye-slim

ARG TARGETPLATFORM
ARG BUILDPLATFORM

RUN echo "I am running on $BUILDPLATFORM, building for $TARGETPLATFORM" > /log

# Create app directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install packages
RUN yarn install

# Copy the app code
COPY . .

# Run the application
CMD [ "node", "src/index.js" ]