## Installation and Set Up

Install and configure Docker Desktop

### Docker Desktop Installation

https://courses.devopsdirective.com/docker-beginner-to-pro/lessons/03-installation-and-set-up/01-installing-docker-desktop

### Try Docker

run a simple container with a command

```shell
docker run docker/whalesay cowsay "👋 Hello Docker"
```

run a container database using postgres:15.1-alpine image

`--env`: set enviroment variables

`--publish`: mapping host port to container port

```shell
docker run --env POSTGRES_PASSWORD=password --publish 5432:5432 postgres:15.1-alpine
```

then you can connect to postgres sql console, run any sql statement:

```postgresql
SELECT * FROM information_schema.tables;
-- or
SELECT NOW();
```
