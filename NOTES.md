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

### Usecases

For me, the main categories are :

1. [databases](./04-using-3rd-party-containers#a-databases)
2. [interactive test environments](./04-using-3rd-party-containers#b-interactive-test-environments) (Operating systems and Programming runtimes)
3. [CLI utilities](./04-using-3rd-party-containers#c-cli-utilities)
