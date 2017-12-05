# Path App

Sample project that takes path routing requests, uses Google's API to solve them, and allow the user to retrieve the results at a later time.

## Setup

### Requirements

* docker
* docker-compose


### Setup volume paths

Open `docker-compose.yml` and observe the `volumes` parameter for the containers.

By default the mongo service wishes to use your machine's `~/.mongo/db` path for the database folder. Change the path as necessary to suit your preferences, or remove/comment the `volumes` parameter out if not needed.

The `path_app` service has the `volumes` parameter commented out by default, but you may change it so that the project folder on your machine is mounted to the container.

This is especially useful when running the application in dev mode (see **Running the app** below), as `nodemon` is used. It automatically restarts the server for you when it sees any changes. Without the `volumes` option set up, if you make any changes to the project in dev mode you will have to rebuild the image.

### Provide a Google API key

In order for the app to make calls to Google's API, it needs to be given an API key with Directions API enabled. Consult Google's instructions [here](https://developers.google.com/maps/documentation/directions/) (click the "GET A KEY" button) for more information on how to do this.

Once you have an API key (with Directions API enabled), you will need to put it in a file `api_key.env` located on the app folder's root (same level as the `docker-compose.yml` file). It should look like this:


```
# ./api_key.env
G_API_KEY=%%%%%%%%%%%%%%%%%%%%%%%%%%
```

Where the '%'s should be replaced with your key. `docker-compose.yml` is configured to apply the environment values in this file (see parameter `env_file` under the `path_app` service definition).

## Running the app

To start the app, simply do:

`docker-compose up --build`

This will start the app at production mode with info-level logging. If you've built the images before and there are no changes since, you can skip the `--build` tag.

Optionally, to run the app in dev mode with debug-level logging instead, do:

`PATH_RUN=devstart docker-compose up --build`

> **NOTE:** If you use `sudo` to run `docker-compose`, don't forget that assignment of the environment variable has to be placed after, NOT before, the sudo command: e.g. `sudo PATH_RUN=devstart docker-compose ...`, NOT `PATH_RUN=devstart sudo docker-compose ...`. This is because `sudo` does not carry over your environment variables by default, but uses the root user's instead.

Development mode also uses `nodemon`, so if you mounted the project folder to your container using the `volumes` option (see **Setup volume paths** under **Installation**) the app will automatically restart the server for you upon seeing any changes you make.

## Running tests

To run all the provided tests, do:

`PATH_RUN=test docker-compose up --build`

As of now, integration tests under `test/api` still perform real Google Directions API calls (and thus still requires `api_key.env` to be present). One possible future improvement is to stub it to return fake Directions API responses, which would allow for more detailed integration testing e.g. correctness of the controller logic that deals with API error responses.
