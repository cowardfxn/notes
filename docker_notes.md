# docker notes

#### create docker image
In directory with files to be included in docker image and a Dockerfile describing what to do for creating an image

command: `docker build -t image_name`

**Dockerfile**

```
# Use an official Python runtime as a parent image
FROM python:2.7-slim

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NAME World

# Run app.py when the container launches
CMD ["python", "app.py"]
```

##### run the app in image
`docker run -p outer_port:image_port image_name`

##### run in detached mode
`docker run -d -p outer_port:image_port image_name`

##### show containers
`docker container ls -a`

##### stop running
`docker container stop container_id`

#### Upload image to docker cloud
You need to register an account on docker cloud, then...

###### login
```docker login```

###### create image tag
```
docker tag image_name username/repository:tag

e.g.
docker tag friendlyhello john/starters:part1
```

###### upload image
```docker push username/repository:tag```

##### pull and run the image from remote repository
```docker run -p local_port:image_port username/repository:tag```

Will pull the latest image if tag is not specified.

### Services
A service can hold multiple containers. User a `.yml` file (docker-compose file) to define services.

##### docker compose file example
```
# docker-compose.yml

version: "3"
services:
  web:
    image: username/repo:tag
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: "0.1"
          memory: 50M
      restart_policy:
        condition: on-failure
    ports:
      - "80:80"
    networks:
      - webnet
networks:
  webnet:
```

The user need to deploy service on a docker cluster, so that services can achieve load balance internally(with multiple containers on multiple machines) and inter-services(with multiple machines in swarm)

##### initialize swarm
`docker swarm init`  
Executing this command will set current mathcine to a swarm manager, you don't need to run this command on other machines

##### deploy services and set service name
`docker stack deploy -c docker-compose.yml service_name`
If the yml file is modified after the service is started, execute this command again and docker wil do an in-place update, no need to restart the entire service/stack.

##### show services
`docker service ls -a`

##### grep service by name
`docker service ps service_name`

##### only show service id
`docker service ls -q -a`

##### remove stack
`docker stack rm service_name`

##### close the swarm
`docker swarm leave --force`

### docker machine
Virtual or physical machines in docker swarm except swarm manager are called docker machine.  
You can control docker machine with these commands:

```
docker-machine create --driver virtualbox myvm1 # Create a VM (Mac, Win7, Linux)
docker-machine create -d hyperv --hyperv-virtual-switch "myswitch" myvm1 # Win10
docker-machine env myvm1                # View basic information about your node
docker-machine ssh myvm1 "docker node ls"         # List the nodes in your swarm
docker-machine ssh myvm1 "docker node inspect <node ID>"        # Inspect a node
docker-machine ssh myvm1 "docker swarm join-token -q worker"   # View join token
docker-machine ssh myvm1   # Open an SSH session with the VM; type "exit" to end
docker node ls                # View nodes in swarm (while logged on to manager)
docker-machine ssh myvm2 "docker swarm leave"  # Make the worker leave the swarm
docker-machine ssh myvm1 "docker swarm leave -f" # Make master leave, kill swarm
docker-machine ls # list VMs, asterisk shows which VM this shell is talking to
docker-machine start myvm1            # Start a VM that is currently not running
docker-machine env myvm1      # show environment variables and command for myvm1
eval $(docker-machine env myvm1)         # Mac command to connect shell to myvm1
& "C:\Program Files\Docker\Docker\Resources\bin\docker-machine.exe" env myvm1 | Invoke-Expression   # Windows command to connect shell to myvm1
docker stack deploy -c <file> <app>  # Deploy an app; command shell must be set to talk to manager (myvm1), uses local Compose file
docker-machine scp docker-compose.yml myvm1:~ # Copy file to node's home dir (only required if you use ssh to connect to manager and deploy the app)
docker-machine ssh myvm1 "docker stack deploy -c <file> <app>"   # Deploy an app using ssh (you must have first copied the Compose file to myvm1)
eval $(docker-machine env -u)     # Disconnect shell from VMs, use native docker
docker-machine stop $(docker-machine ls -q)               # Stop all running VMs
docker-machine rm $(docker-machine ls -q) # Delete all VMs and their disk images
```

There are still other commands and docker compose attributes needed to learn.
