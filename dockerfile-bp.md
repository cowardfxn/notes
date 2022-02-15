# `Dockerfile` best practice

[Official site Ref](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

- create ephemeral containers
- understand build context  all content under current directory are treated as build context
- exclude files with `.dockerignore`
- use multi-stage builds  `RUN`, `COPY`, `ADD` clause creates a new layer of image, separate static layers and frequently changed layers by multiple `RUN`, `COPY` or `ADD` in a `Dockerfile`, so that Docker can use *build cache* in subsequent builds
- minimize the number of layers  only create new layer when it's necessary, reduce rebuild time
- once the cache is invalidated, all subsequent `Dockerfile` commands generate new images and the cache is not used.
- split long commands or command with many arguments to multiple lines by backslashes ("\\")
- `CMD` executes commands like `RUN`, but `RUN` creates a new stage for caching, `CMD` doesn't
- `ADD` support local tar file auto-extraction
- If you have multiple local files, `COPY` them individually
- `ENTRYPOINT`  allows you to configure a container that will run as an executable, run it as `docker run [container-name]`. You can pass arguments by `CMD ["arg1", "arg2"]` in `Dockerfile`, or in command line `-p`
- `USER`  change user to a non-root user
- `WORKDIR`  change working directory, absolute path preferred, avoid using `RUN cd ...` to change directory.



terminology  术语



