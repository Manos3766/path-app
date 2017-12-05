FROM node:carbon

# Create app directory
WORKDIR /usr/src/path_app

# Install app package dependencies & install them
COPY package.json /usr/src/path_app
COPY package-lock.json /usr/src/path_app
RUN npm install

# Copy the rest of application code
COPY ./app /usr/src/path_app/app
COPY ./bin /usr/src/path_app/bin
COPY ./test /usr/src/path_app/test
