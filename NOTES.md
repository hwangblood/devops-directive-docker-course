<h1><center>DevOps Directive Docker Course</center></h1>

[TOC]

# Installation and Set Up

Install and configure Docker Desktop

## Docker Desktop Installation

https://courses.devopsdirective.com/docker-beginner-to-pro/lessons/03-installation-and-set-up/01-installing-docker-desktop

## Try Docker

run a simple container with a command:

```shell
docker run docker/whalesay cowsay "Hello Docker! 👋"
```

run a container database using `postgres:15.1-alpine` image:

`--env`: also `-e`, set enviroment variables

`--publish`: also `-p`, mapping host port to container port

```shell
docker run --env POSTGRES_PASSWORD=password --publish 5432:5432 postgres:15.1-alpine
```

then you can connect to postgres sql console, run any sql statement:

```postgresql
SELECT * FROM information_schema.tables;
-- or
SELECT NOW();
```

# Using 3rd Party Container Images

Use publicly available container images in your developer workflows and learn how about container data persistence.

## Persisting Data with Containers

### Installing Dependencies

run a container from `ubuntu:20.04` image:

`--interactive`: also `-i`, Keep STDIN open even if not attached

`--tty`: also `-t`, Allocate a pseudo-TTY

`--rm`: Automatically remove the container when it exits

```shell
# Create a container from the ubuntu image
docker run --interactive --tty --rm ubuntu:22.04

# Try to ping google.com
ping bing.com -c 1 # This results in `bash: ping: command not found`

# Install ping
apt update
apt install iputils-ping --yes

ping bing.com -c 1 # This time it succeeds!
exit
```

Let's try that again:

docker will create a new container, so `ping` command is not existed.

`-it`: both `--interactive` and `--tty`

```shell
docker run -it --rm ubuntu:22.04
ping google.com -c 1 # It fails! 🤔
```

**How can we persist data in the container?**

We can give the container a name so that we can tell docker to reuse it:

here, we haven't use `--rm`, so that container still exists after exiting

```shell
# Create a container from the ubuntu image (with a name and WITHOUT the --rm flag)
docker run -it --name my-ubuntu-container ubuntu:22.04

# Install & use ping
apt update
apt install iputils-ping --yes
ping google.com -c 1
exit

# List all containers
docker container ps -a | grep my-ubuntu-container
docker container inspect my-ubuntu-container

# Restart the container and attach to running shell
docker start my-ubuntu-container
docker attach my-ubuntu-container

# Test ping
ping google.com -c 1 # It should now succeed! 🎉
exit
```

This is good, but not good enough, because we have to prepare needed data when start container at the first time.

What we want is the container that we will luanch always depends on some prepared data or dependencies.

So that, we can build our own container image.

```shell
# Build a container image with ubuntu image as base and ping installed
docker build --tag my-ubuntu-image -<<EOF
FROM ubuntu:22.04
RUN apt update && apt install iputils-ping --yes
EOF

# Run a container based on that image
docker run -it --rm my-ubuntu-image

# Confirm that ping was pre-installed
ping google.com -c 1 # Success! 🥳
```

After that, the `ping` command dependency will be contained in our own image `my-ubuntu-image`

Once we start a container, the dependencies will be able to be used for us.

### Persisting Data Produced by the Application

When we run any app in a container, it could produce some data, such as: logs, database data etc

```shell
# Create a container from the ubuntu image
docker run -it --rm ubuntu:22.04

# Make a directory and store a file in it
mkdir my-data
echo "Hello from the container!" > /my-data/hello.txt

# Confirm the file exists
cat my-data/hello.txt
exit
```

These data produced by the application shouldn't be presisted in container, because containers aren't depend on them, but just use them.

There are two ways to presist data out of container:

1. **Volume Mounts**: Mount volumes to the container
2. **Bind Mounts**: Mount host filesystem to the container

**How to use <u>_Volume Mounts_</u>?**

```shell
# create a named volume
docker volume create my-volume

# Create a container and mount the volume into the container filesystem
docker run  -it --rm --mount source=my-volume,destination=/my-data/ ubuntu:22.04
# There is a similar (but shorter) syntax using -v which accomplishes the same
docker run  -it --rm -v my-volume:/my-data ubuntu:22.04

# Now we can create and store the file into the location we mounted the volume
echo "Hello from the container!" > /my-data/hello.txt
cat my-data/hello.txt
exit
```

This approach can then be used to mount a volume at the known path where a program persists its data:

data stored path of postgres datababse in container is `/var/lib/postgresql/data`

```bash
# Create a container from the postgres container image and mount its known storage path into a volume named pgdata
docker volume create pgdata
docker run -it --rm -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=password --publish 5432:5432 postgres:15.1-alpine
```

Now, our data is stored in volumes.

**Where is this data (stored by volumes) located in conputer's filesystem?**

On linux it would be at `/var/lib/docker/volumes`... but remember, on docker desktop, Docker runs a linux virtual machine.

One way we can view the filesystem of that VM is to use a [container image](https://hub.docker.com/r/justincormack/nsenter1) created by `justincormat` that allows us to create a container within the namespace of PID 1. This effectively gives us a container with root access in that VM.

**\*NOTE:** Generally you should be careful running containers in privileged mode with access to the host system in this way. Only do it if you have a specific reason to do so and you trust the container image.\*

```bash
# Create a container that can access the Docker Linux VM
# Pinning to the image hash ensures it is this SPECIFIC image and not an updated one helps minimize the potential of a supply chain attack
docker run -it --rm --privileged --pid=host justincormack/nsenter1@sha256:5af0be5e42ebd55eea2c593e4622f810065c3f45bb805eaacf43f08f3d06ffd8

# Navigate to the volume inside the VM at:
ls /var/lib/docker/volumes/my-volume/_data
cat /var/lib/docker/volumes/my-volume/_data/hello.txt # Woohoo! we found our data!
```

**How to use <u>_Bind Mounts_</u>?**

Alternatively, we can mount a directory from the host system using a **bind mount**:

The source folder will be automatically created

```shell
# Create a container that mounts a directory from the host filesystem into the container
docker run  -it --rm --mount type=bind,source="${PWD}"/my-data,destination=/my-data ubuntu:22.04
# Again, there is a similar (but shorter) syntax using -v which accomplishes the same
docker run  -it --rm -v ${PWD}/my-data:/my-data ubuntu:22.04

echo "Hello from the container!" > /my-data/hello.txt

# You should also be able to see the hello.txt file on your host system
cat my-data/hello.txt
exit
```

Bind mounts can be nice if you want easy visibility into the data being stored.

but there are a number of reasons outlined at [Volumes | Docker Documentation](https://docs.docker.com/storage/volumes/) for why volumes are preferred. (including speed if you are running Docker Desktop on windows/mac)

## Using 3rd Party Containers

### Usecases

For me, the main categories are :

1. [databases](./04-using-3rd-party-containers#a-databases)
2. [interactive test environments](./04-using-3rd-party-containers#b-interactive-test-environments) (Operating systems and Programming runtimes)
3. [CLI utilities](./04-using-3rd-party-containers#c-cli-utilities)

# Example Web Application

Building out a realistic microservice application to containerize.

a minimal 3-tier web application, It has the following components:

- React front end
- NodeJS API
- Golang API
- Postgres Database

first we can explore the code and run it on our host system directly.

make sure the cureent path is the root folder of this repository.

## Setting up the Postgres Database

```shell
docker run -d \
	-e POSTGRES_PASSWORD=foobarbaz \
	-v pgdata:/var/lib/postgresql/data \
	-p 5432:5432 \
	postgres:15.1-alpine
```

or

```shell
pushd 05-example-web-application/
make run-postgres
```

listening on IPv4 address "0.0.0.0", port 5432

## Running the Node.js API

```shell
pushd 05-example-web-application/api-node
npm install
DATABASE_URL=postgres://postgres:foobarbaz@localhost:5432/postgres \
	npm run dev
```

or

```shell
pushd 05-example-web-application/
make run-api-node
```

Example app listening on port 3000

## Running the Golang API

```shell
pushd 05-example-web-application/api-golang
mkdir go-workspace
export GOPATH=$PWD/go-workspace
go mod download
DATABASE_URL=postgres://postgres:foobarbaz@localhost:5432/postgres \
    go run main.go
```

or

```shell
pushd 05-example-web-application/
make run-api-golang
```

Listening and serving HTTP on :8080

## Running the React Client

```shell
pushd 05-example-web-application/client-react
npm install
DATABASE_URL=postgres://postgres:foobarbaz@localhost:5432/postgres \
	npm run dev
```

or

```shell
pushd 05-example-web-application/
make run-client-react
```

**Local**: http://localhost:5173/

# Building Container Images

Write and optimize Dockerfiles and build container images for the components of the example web app.

## Docker Build Overview

### What is a Dockerfile?

A Dockerfile is a text document that contains all the commands required to create and assemble a container image.

It serves as a recipe for your application:

```
👨‍🍳 Application Recipe:
---------------------------------------
1. Start with an Operating System
2. Install the language runtime
3. Install any application dependencies
4. Set up the execution environment
5. Run the application
```

### The Docker Build Context

The Dockerfile is paired with a build context, which is usually a folder or directory on your local system containing your source code. 

The build context can also be a URL, such as a public GitHub repository. 

Docker uses the Dockerfile and build context together when running the `docker build` command to produce a container image.

### The .dockerignore File

like `.gitignore` for Git.

### Writing a Dockerfile

When writing a Dockerfile, you can refer to the [Docker documentation](https://docs.docker.com/engine/reference/builder/) for a list of valid commands. The format for a Dockerfile is relatively simple:

A hash (`#`) is used for comments. Instructions are written in all caps, followed by arguments. For example:

```bash
# This step installs dependencies
RUN apt-get update && apt-get install -y <package_name>
```

### Common Commands in a Dockerfile

Here are some you'll encounter in almost every Dockerfile:

- FROM: Specifies the base layer or operating system for the container image.
- RUN: Executes a command during the build phase.
- COPY: Copies files from the build context (e.g., your local system) to the container image.
- CMD: Provides a command to be executed when the container starts.

### Docker build command

We can take a Dockerfile and a build context and use the `docker build` command to create a Docker Container Image!

```shell
docker build -f Dockerfile .
```

Here the `.` indicates that the current directory should be used as the build context.

> **Note:** You only have to pass a Dockerfile name if it is named something other than "Dockerfile"

## NodeJS API

### Naive Implementation

From `ubuntu:22.04` image:

```dockerfile
FROM ubuntu:22.04
RUN apt update && apt install nodejs npm --yes
COPY . .
RUN npm install
CMD [ "npm", "run", "dev" ]
```

From `node:latest` image:

```dockerfile
# node means node:latest
FROM node
COPY . .
RUN npm install
CMD [ "npm", "run", "dev" ]
```

### Pin the Base Image (🔒+🏎️)

From `node:19.6-bullseye-slim` image for reduced image size:

```dockerfile
# Pin specific version
#-------------------------------------------
# Pin specific version (use slim for reduced image size)
FROM node:19.6-bullseye-slim
#-------------------------------------------
COPY . .
RUN npm install
CMD [ "npm", "run", "dev" ]
```

### Set a Working Directory (👁️)

Copy package.json and package-lock.json Before the Source Code (🏎️)

```dockerfile
FROM node:19.6-bullseye-slim
#-------------------------------------------
# Specify working directory other than /
WORKDIR /usr/src/app
#-------------------------------------------
# Copy only files required to install dependencies (better layer caching)
COPY package*.json ./
RUN npm install
# Copy remaining source code AFTER installing dependencies.
# Again, copy only the necessary files
COPY ./src/ .
#-------------------------------------------
# For production environment
CMD [ "node", "index.js" ]
```

### Use a non-root USER (🔒)

```dockerfile
FROM node:19.6-bullseye-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
#-------------------------------------------
# Use non-root user
# Use --chown on COPY commands to set file permissions
USER node
COPY --chown=node:node ./src/ .
#-------------------------------------------
CMD [ "node", "index.js" ]
```

### Configure for the Production Environment (🔒 + 🏎️)

Many Node.js packages look for the `NODE_ENV` environment variable and behave differently if it is set to production (reduced logging, etc...). We can set this within the Dockerfile to ensure it will be set at runtime by default.

Also, rather than using `npm install` it is preferable to use `npm ci` or ["clean install"](https://docs.npmjs.com/cli/v9/commands/npm-ci) which requires the use of a `package-lock.json` file and ensures the installed dependencies match the fully specified versions from that file. By using `--only=production` we can avoid installing unnecessary development dependencies reducing the attack surface area and further reducing the image size.

```dockerfile
FROM node:19.6-bullseye-slim
#-------------------------------------------
# Set NODE_ENV
ENV NODE_ENV production
#-------------------------------------------
WORKDIR /usr/src/app
COPY package*.json ./
#-------------------------------------------
# Install only production dependencies
RUN npm ci --only=production
#-------------------------------------------
USER node
COPY --chown=node:node ./src/ .
CMD [ "node", "index.js" ]
```

### Add Useful Metadata (👁️)

There are a few Dockerfile instructions that don't change the container runtime behavior, but do provide useful metadata for users of the resulting container image.

We can add `LABEL` instructions with various annotations about the container image. For example we might want to include the Dockerfile author, version, licenses, etc... A set of suggested annotation keys from the Open Container Initiative can be found here: https://github.com/opencontainers/image-spec/blob/main/annotations.md.

```dockerfile
FROM node:19.6-bullseye-slim
#-------------------------------------------
# Use LABELS to provide additional info
LABEL org.opencontainers.image.authors="sid@devopsdirective.com"
#-------------------------------------------
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
USER node
COPY --chown=node:node ./src/ .
#-------------------------------------------
# Indicate expected port
EXPOSE 3000
#-------------------------------------------
CMD [ "node", "index.js" ]
```

### Use a Cache Mount to Speed Up Dependency Installation (🏎️)

[Buildkit](https://docs.docker.com/build/buildkit/) provides many useful features, including the ability to specify a cache mount for specific `RUN` instructions within a Dockerifle. By specifying a cache in this way, changing a dependency won't require re-downloading all dependencies from the internet, because previously installed dependencies will be stored locally.

To use Docker BuildKit by default, edit the Docker daemon configuration in `/etc/docker/daemon.json` as follows, and restart the daemon.

```json
{
  "features": {
    "buildkit": true
  }
}
```

***Note:\*** If building the image in a remote continuous Integration system (e.g. GitHub Actions), we would need to configure that system to store and retrieve this cache across pipeline runs.

```dockerfile
FROM node:19.6-bullseye-slim
LABEL org.opencontainers.image.authors="sid@devopsdirective.com"
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY package*.json ./
#-------------------------------------------
# Use cache mount to speed up install of existing dependencies
RUN --mount=type=cache,target=/usr/src/app/.npm \
  npm set cache /usr/src/app/.npm && \
  npm ci --only=production
#-------------------------------------------
USER node
COPY --chown=node:node ./src/ .
EXPOSE 3000
CMD [ "node", "index.js" ]
```

### Use a Multi-Stage Dockerfile (👁️)

[Multi-stage builds](https://docs.docker.com/build/building/multi-stage/) are a docker feature that helps to optimize container images by including multiple independent stages within a Dockerfile.

By splitting out separate development and production image stages we can have an ergonomic dev environment with dev dependencies, hot reloading, etc... but retain security and size improvements for deployment.

Shared steps can be built into a `base` stage and then customizations can be built on top of that base.

```dockerfile
#-------------------------------------------
# Name the first stage "base" to reference later
FROM node:19.6-bullseye-slim AS base
#-------------------------------------------
LABEL org.opencontainers.image.authors="sid@devopsdirective.com"
WORKDIR /usr/src/app
COPY package*.json ./
#-------------------------------------------
# Use the base stage to create dev image
FROM base AS dev
#-------------------------------------------
RUN --mount=type=cache,target=/usr/src/app/.npm \
  npm set cache /usr/src/app/.npm && \
  npm install
COPY . .
CMD ["npm", "run", "dev"]
#-------------------------------------------
# Use the base stage to create separate production image
FROM base AS production
#-------------------------------------------
ENV NODE_ENV production
RUN --mount=type=cache,target=/usr/src/app/.npm \
  npm set cache /usr/src/app/.npm && \
  npm ci --only=production
USER node
COPY --chown=node:node ./src/ .
EXPOSE 3000
CMD [ "node", "index.js" ]
```

### Compare Images Size

build commands:

```shell
docker build .

docker build --tag api-node:0.0 .

docker build --file Dockerfile.v2 --tag api-node:0.2 .

DOCKER_BUILDKIT=1 docker buildx build --file Dockerfile.v7 --tag api-node:0.7 .
```

Image Size:

```shell
api-node                 0.0                  2ec9c0e52601   About an hour ago   973MB
api-node                 0.1                  85bae7b5ff1e   2 hours ago         1.04GB
api-node                 0.2                  a6536735b701   2 hours ago         284MB
api-node                 0.3                  7f3491a67c05   2 hours ago         248MB
api-node                 0.4                  758aa0346de1   About an hour ago   284MB
api-node                 0.5                  410c3739f12d   About an hour ago   253MB
api-node                 0.6                  e73a922d16ef   About an hour ago   253MB
api-node                 0.7                  39bb1ae186f4   44 minutes ago      250MB
api-node                 0.8                  7c1bba399564   40 minutes ago      250MB
```

## Golang API

In this section of the course we will build out a Dockerfile for the Golang API, starting with a simple naive approach, and systematically improving it!

### Naive Implementation

```dockerfile
FROM golang
WORKDIR /app
COPY . .
RUN go mod download
CMD ["go", "run", "./main.go"]
```

### Pin the Base Image (🔒+🏎️)

We can choose a specific base image that is small and secure to meet the needs of our application.

```bash
#-------------------------------------------
# Pin specific version for stability. Use debian for easier build utilities.
FROM golang:1.19-bullseye AS build
#-------------------------------------------
WORKDIR /app
COPY . .
RUN go mod download
CMD ["go", "run", "./main.go"]
```

### Build the Binary in the Dockerfile (🏎️)

We should build the application within the container image and then execute the build binary upon startup.

```dockerfile
FROM golang:1.19-bullseye
WORKDIR /app
COPY . .
RUN go mod download
#-------------------------------------------
# Compile application during build rather than at runtime
RUN go build -o api-golang
CMD ["./api-golang"]
#-------------------------------------------
```

### Copy go.mod and go.sum Before Source Code (🏎️)

We can also use a [`.dockerignore` file ](https://docs.docker.com/engine/reference/builder/#dockerignore-file)to specify files that should not be included in the container image.

```dockerfile
FROM golang:1.19-bullseye
WORKDIR /app
#-------------------------------------------
# Copy only files required to install dependencies (better layer caching)
COPY go.mod go.sum ./
RUN go mod download
COPY . .
#-------------------------------------------
RUN go build -o api-golang
CMD ["./api-golang"]
```

### Separate Build and Deploy Stages

We can use Docker's [multi-stage build feature](https://docs.docker.com/build/building/multi-stage/) to make our final deployable image MUCH smaller!

```dockerfile
FROM golang:1.19-bullseye AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
#-------------------------------------------
# Add flags to statically link binary
RUN go build \
  -ldflags="-linkmode external -extldflags -static" \
  -tags netgo \
  -o api-golang
# Use separate stage for deployable image
FROM scratch
WORKDIR /
# Copy the binary from the build stage
COPY --from=build /app/api-golang api-golang
#-------------------------------------------
CMD ["/api-golang"]
```

### Set ENV and Expose Port (👁️)

The API framework we are using (Gin) uses the `GIN_MODE` environment variable to determine if it is running in a development or production environment.

We can set `GIN_MODE=release` for our deployable image so it will run in production mode.

```dockerfile
FROM golang:1.19-bullseye AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build \
  -ldflags="-linkmode external -extldflags -static" \
  -tags netgo \
  -o api-golang

FROM scratch
WORKDIR /
#-------------------------------------------
# Set gin mode
ENV GIN_MODE=release
#-------------------------------------------
COPY --from=build /app/api-golang api-golang
CMD ["/api-golang"]
```

### Use a non-root USER (🔒)

We can use the `useradd` command to add a non-root user to the build stage, and then copy the corresponding files into scratch to use it.

```dockerfile
FROM golang:1.19-bullseye AS build
#-------------------------------------------
# Add non root user
RUN useradd -u 1001 nonroot
#-------------------------------------------
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build \
  -ldflags="-linkmode external -extldflags -static" \
  -tags netgo \
  -o api-golang

FROM scratch
WORKDIR /
ENV GIN_MODE=release
#-------------------------------------------
# Copy the passwd file
COPY --from=build /etc/passwd /etc/passwd
COPY --from=build /app/api-golang api-golang
# Use nonroot user
USER nonroot
#-------------------------------------------
CMD ["/api-golang"]
```

### Add Useful Metadata (👁️)

We can add `LABEL` instructions with various annotations about the container image. For example we might want to include the Dockerfile author, version, licenses, etc... A set of suggested annotation keys from the Open Container Initiative can be found here: https://github.com/opencontainers/image-spec/blob/main/annotations.md.

The `EXPOSE` command tells end users the port number that the containerized application expects to listen on. 

```dockerfile
FROM golang:1.19-bullseye AS build
#-------------------------------------------
# Use LABELS to provide additional info
LABEL org.opencontainers.image.authors="sid@devopsdirective.com"
#-------------------------------------------
RUN useradd -u 1001 nonroot
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build \
  -ldflags="-linkmode external -extldflags -static" \
  -tags netgo \
  -o api-golang

FROM scratch
WORKDIR /
ENV GIN_MODE=release
#-------------------------------------------
# Indicate expected port
EXPOSE 8080
#-------------------------------------------
COPY --from=build /etc/passwd /etc/passwd
COPY --from=build /app/api-golang api-golang
USER nonroot
CMD ["/api-golang"]
```

### Use a Cache Mount to Speed Up Dependency Installation (🏎️)

Buildkit provides many useful features, including the ability to specify a cache mount for specific RUN instructions within a Dockerifle. By specifying a cache in this way, changing a dependency won't require redownloading all dependencies from the internet because previously installed dependencies will be stored locally.

```dockerfile
FROM golang:1.19-bullseye AS build
RUN useradd -u 1001 nonroot
WORKDIR /app
COPY go.mod go.sum ./
#-------------------------------------------
# Use cache mount to speed up install of existing dependencies
RUN --mount=type=cache,target=/go/pkg/mod \
  --mount=type=cache,target=/root/.cache/go-build \
  go mod download
#-------------------------------------------
COPY . .
RUN go build \
  -ldflags="-linkmode external -extldflags -static" \
  -tags netgo \
  -o api-golang

FROM scratch
ENV GIN_MODE=release
EXPOSE 8080
WORKDIR /
COPY --from=build /etc/passwd /etc/passwd
COPY --from=build /app/api-golang api-golang
USER nonroot
CMD ["/api-golang"]
```

### Compare Images Size

build commands:

```shell
docker build --file Dockerfile.v<version> --tag api-golang:0.<version> .
```

Image Size:

```shell
$ docker image ls | grep api-golang                                                                                         
api-golang               0.8                  c36bb24438ef   12 minutes ago   16.8MB
api-golang               0.7                  6f3203be6e36   12 minutes ago   16.8MB
api-golang               0.6                  3c8de2ac5082   12 minutes ago   16.8MB
api-golang               0.5                  df9389a61c2c   17 minutes ago   16.8MB
api-golang               0.4                  ede1cb050a76   17 minutes ago   16.8MB
api-golang               0.3                  56d8680e394e   24 minutes ago   1.2GB
api-golang               0.2                  488f99d87ffb   27 minutes ago   1.2GB
api-golang               0.1                  6b2ce968d700   27 minutes ago   1.12GB
api-golang               0.0                  0df5322b32de   33 minutes ago   909MB
```

## React Client

In this section of the course we will build out a Dockerfile for the React Client API, starting with a simple naive approach, and systematically improving it!

### Naive Implementation

The naive implementation should look very familiar, since it't nearly identical to that of the Node API.

Running a container from this image will run our `vite` development server.

```dockerfile
FROM node
COPY . .
RUN npm install
CMD ["npm", "run", "dev"]
```

### Pin the Base Image (🔒+🏎️)

smaller base image

```dockerfile
#-------------------------------------------
# Pin specific version for stability
FROM node:19.4-bullseye
#-------------------------------------------
COPY . .
RUN npm install
CMD ["npm", "run", "dev"]
```

### Set WORKDIR and COPY package.json File

install all dependencies before copying source code and run it

```dockerfile
FROM node:19.4-bullseye
#-------------------------------------------
# Specify working directory other than /
WORKDIR /usr/src/app
# Copy only files required to install dependencies (better layer caching)
COPY package*.json ./
#-------------------------------------------
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

### Use a Cache Mount (🏎️)

To help speed up dependency installation we can add a cache mount and tell npm to use it.

```dockerfile
FROM node:19.4-bullseye
WORKDIR /usr/src/app
COPY package*.json ./
#-------------------------------------------
# Use cache mount to speed up install of existing dependencies
RUN --mount=type=cache,target=/usr/src/app/.npm \
  npm set cache /usr/src/app/.npm && \
  npm install
#-------------------------------------------
COPY . .
CMD ["npm", "run", "dev"]
```

### Separate Build and Deploy Stages

Our React app will be built into a set of static files (HTML, CSS, and JS) that we can then deploy in a variety of ways.

Here we will build the application in one stage and then copy those into a second stage running Nginx!

```dockerfile
FROM node:19.4-bullseye AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN --mount=type=cache,target=/usr/src/app/.npm \
  npm set cache /usr/src/app/.npm && \
  npm install
COPY . .
RUN npm run build
#-------------------------------------------
# Use separate stage for deployable image
FROM nginxinc/nginx-unprivileged:1.23-alpine-perl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build usr/src/app/dist/ /usr/share/nginx/html
EXPOSE 8080
#-------------------------------------------
```

### Use COPY --link

One final tweak we can make is to use the COPY --link syntax in the second stage. This will allow us to avoid invalidating the layer cache if we change the second stage base image.

```dockerfile
FROM node:19.4-bullseye AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN --mount=type=cache,target=/usr/src/app/.npm \
  npm set cache /usr/src/app/.npm && \
  npm install
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.23-alpine-perl
#-------------------------------------------
# Use COPY --link to avoid breaking cache if we change the second stage base image
COPY --link nginx.conf /etc/nginx/conf.d/default.conf
COPY --link --from=build usr/src/app/dist/ /usr/share/nginx/html
#-------------------------------------------
EXPOSE 8080
```

### Compare Images Size

build commands:

```shell
docker build --file Dockerfile.v<version> --tag client-react:0.<version> .
```

Image Size:

```shell
$ docker image ls | grep client-react                                                                                        
client-react             0.5                  d856db872b42   34 seconds ago   76.7MB
client-react             0.4                  d856db872b42   34 seconds ago   76.7MB
client-react             0.3                  3f87151d6f7d   2 minutes ago    1.12GB
client-react             0.2                  0ef2315a4741   3 minutes ago    1.16GB
client-react             0.1                  b8756b559ff3   3 minutes ago    1.16GB
client-react             0.0                  6ef883b3d7ac   6 minutes ago    1.16GB
```

**Notes** , client-react:0.4 and client-react:0.5 have the same image-id.

## Writing Good Dockerfiles

### General Process

Dockerfiles generally have steps that are similar to those you would use to get your application running on a server.

```
1. Start with an Operating System
2. Install the language runtime
3. Install any application dependencies
4. Set up the execution environment
5. Run the application
```

**Note:** We can often jump right to #3 by choosing a base image that has the OS and language runtime preinstalled.

### Useful Techniques:

Here are some of the techniques demonstrated in the Dockerfiles within this repo:

https://courses.devopsdirective.com/docker-beginner-to-pro/lessons/06-building-container-images/05-general-dockerfile-tips#useful-techniques

### Impact of Applying These Techniques

In general, these techniques impact some combination of (1) build speed, (2) image security, and (3) developer clarity. The following summarizes these impacts:

```text
Legend:
 🔒 Security
 🏎️ Build Speed
 👁️ Clarity
```

https://courses.devopsdirective.com/docker-beginner-to-pro/lessons/06-building-container-images/05-general-dockerfile-tips#impact-of-applying-these-techniques

## Choosing a Base Image

When choosing a base image for your container, it's important to consider factors such as **Size**, **Language Support**, **Ergonomics**, and **Security**. In this guide, we'll discuss these considerations and present some sample images for a Node.js application.

https://courses.devopsdirective.com/docker-beginner-to-pro/lessons/06-building-container-images/06-choosing-a-base-image

For general-purpose use, the `node:slim (Bullseye)` image is a good choice due to its balance between size, security, and ease of use.

## Additional Dockerfile Features

https://courses.devopsdirective.com/docker-beginner-to-pro/lessons/06-building-container-images/07-additional-dockerfile-features

## Container Registries

...
