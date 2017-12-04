FROM node:carbon

# Create app directory
WORKDIR /usr/src/path_app

# Install app package dependencies & install them
COPY package.json /usr/src/path_app
COPY package-lock.json /usr/src/path_app
RUN npm install

# Copy the rest of application code
COPY . /usr/src/path_app

# Finaly, expose port and start server
EXPOSE 8080
CMD [ "npm", "start" ]
