# Path App

Sample project that takes path routing requests, uses Google's API to solve them, and allow the user to retrieve the results at a later time.

## Setup

### Requirements

* docker
* docker-compose


### Setup volume paths

Open `docker-compose.yml` and observe the `volumes` parameter for both provided containers.

By default the mongo service wishes to use your machine's `~/.mongo/db` path for the database folder. Change the path as necessary to suit your preferences, or remove/comment the `volumes` parameter out if not needed.

The `path_app` service has the `volumes` parameter commented out by default, but you may change it so that the project folder on your machine is mounted to the container. This is especially useful when running the application in dev mode (see **Running the app** below), as `nodemon` is used: it automatically restarts the server for you when it sees any changes. To run the app in dev mode, also uncomment the `entrypoint` parameter.

Without the `volumes` & `entrypoint` option set up for `path_app`, it will still run but if you make any changes to the project you will have to rebuild the app container in order to see the changes everytime.

### Provide a Google API key

In order for the app to make calls to Google's API, it needs to be given a key. The key must also have Directions API enabled. Consult Google's instructions [here](https://developers.google.com/maps/documentation/directions/) (click the "GET A KEY" button) for more information on how to do this.

Once you have an API key with Directions API enabled, you will need to put it in a file `api_key.env` located on the app folder's root (same level as the `docker-compose.yml` file). It should look like this:


```
# ./api_key.env
G_API_KEY=%%%%%%%%%%%%%%%%%%%%%%%%%%
```

Where the '%'s should be replaced with your key. The app expects the environment variable `G_API_KEY` to be set to the key's value, and `docker-compose.yml` is configured to apply the environment values in this file (see parameter `env_file` under the `path_app` service definition).

## Running the app

To start the app, simply do:

`docker-compose up --build`

This will start the app at info-level logging (if it complains about not being able to connect to the Docker daemon, check if your Docker daemon is running or try using sudo). If there has been no changes to the project since the last startup, you can skip the `--build` flag.

Optionally, to run the app in dev mode with debug-level logging instead, uncomment the `entrypoint` parameter in `docker-compose.yml`. This mode also uses `nodemon`, so if you mounted the project folder to your container using the `volumes` option (see **Setup volume paths** under **Installation**) the app will automatically restart the server for you upon seeing any changes you make.

## Tests

To run all the provided tests, do:

`docker-compose run --no-deps path_app npm run tests`

*TODO: add tests in the next commit*
