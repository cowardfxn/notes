#Apache Spark源码剖析

#### 大数据的概念
 - Volume 数据规模大
 - Velocity 处理速度快，时效性要求较高
 - Varity 数据有丰富的多样性
 - 还有一种说法是加上Value (数据价值?)

###Google的三大论文
 1. MapReduce 计算框架
 2. GFS 数据存储
 3. BigTable NoSQL的始祖

Hadoop主要解决了其中的**两大**问题：  
    1）数据存储  
    2）分布式计算框架  

####Hadoop生态系统
 - Flume *Log controller*
 - ZooKeeper *Coordination*
 - Mahout *Machine learning*
 - Hive *SQL query*
 - YARN Map Reduce v2 *Distributed Processing Framework*
 - Hbase *Connector store*
 - HDFS *Hadoop Distributed File System*
 - Sqoop *Data exchange*
 - Oozie *Work flow*
 - pig *Scripting*
 - R Connector *Statistics*

**在Hadoop的生态系统中，Spark与MapReduce处在同一层级，主要解决分布式计算框架的问题。**

相比Hadoop，Spark的优势主要体现在两个方面：
 1. 计算速度比Hadoop快10到100倍不止
 2. 错误恢复能力远超Hadoop

>Spark的WordCount程序类似其他语言的Hello world!

---
Spark的Map阶段与Reduce阶段划分

 - 可以高度并行处理的操作归为map阶段
 - 并行化程度不高的归为Reduce阶段

**Operation分为*Transformation*和*Action*两类**

虽然都是函数式语言，但相比Python，Scala支持序列化/反序列化，原生支持Hadoop，因此Spark使用了Scala开发。

spark-shell spark-shell的实现是通过封装spark-submit实现的，在spark-submit中会通过取得已经设定好的JAVA环境变量，调用java程序。SparkSubmit中定义了main函数，会运行Spark Repl(即交互界面)。

调用顺序：

 1. SparkSubmit
 2. repl.Main
 3. SparkILoop


####SparkContext启动步骤
 1. 根据初始化参数生成SparkConf，再根据SparkConf创建SparkEnv
 2. 创建TaskScheduler，根据Spark的运行模式来选择相应的SchedulerBackend，并启动TaskScheduler
 3. 以启动的TaskScheduler实例为参数，启动DAGScheduler
 4. 启动WebUI

>Scala已有Repl，为何Spark要另起炉灶？  

> - Scala的Repl实际运行时，是将即时输入语句封装成Object，编译之后郊游JVM执行。每次运行时，都会产生一个新的实例，同时输入中仍存在对应的类，效率低下。
> - 构造新的Repl，所期望的是在交互语句输入时，生成Class而不是Object

Spark的Repl最主要的是实现了SparkIMain。


###作业提交
####从输入到提交
经过一系列的RDD转换操作，数据与需要执行的方法通过runJob被传给Spark内核，开始执行。

*为了在不同类型的RDD之间使用各种方法，RDD操作可能会使用隐式转换(如k, v形式的MappedRDD使用reduceByKey之前，会被转换为PairedRDDFunctions)。*


 - scala在创建闭包时，可能会捕捉过多的变量，或者取到过大的实例，影响数据在集群内的传递和变量序列化，Spark的ClosureCleaner就是用来移除不必要的外部变量的。


####作业执行
主要分为Driver和Executor两部分
#####Driver
主要解决以下问题

 1. RDD依赖分析，生成DAG(有向无环图)
 2. 根据DAG将Job分割为多个Stage
 3. Stage一经确认，即生成相应的Task，将生成的Task分发到Excecutor执行

![全部函数调用](https://github.com/cowardfxn/notes/blob/master/img/runJob.jpg)

#####窄依赖与宽依赖
 - 窄依赖指父RDD的输出都会被指定的子RDD消费，输出路径是固定的
  * 导致窄依赖的转换(Transformation)  
*map*  
*flatmap*  
*filter*  
*sample*
 - 宽依赖是指父RDD的输出会由不同的RDD消费，即输出路径不固定
    * 导致宽依赖的Transformation  
*sortByKey*  
*reduceByKey*  
*groupByKey*  
*cogroupByKey*  
*join*  
*cartensian*

**Scheduler(调度器)**会根据RDD间的依赖关系，将拥有持续窄依赖关系的RDD归于同一Stage中，而宽依赖则会作为划分不同Stage的判断标准。

*宽依赖会导致RDD shuffle？*

创建Stage之前，需要先确定该Stage要从多少个Partition读入数据，这个数值直接影响要创建多少个Task。

#####submitStage流程
 - 所依赖的Stage是否都已完成，如果没有，则先执行所依赖的Stage(从后向前递归)
 - 如果所有的依赖都已完成，则提交自身所处的Stage

#####Stage划分依据
判断是否存在ShuffleDependency，如果有则创建新的Stage。  
以下的RDD会返回ShuffleDependency:

 - ShuffledRDD
 - CoGroupedRDD
 - SubtractedRDD

综上所述，Stage划分完毕就已经明确了如下内容：

 1. 产生的Stage需要从多少个Partition中读取数据
 2. 产生的Stage会生成多少Partition
 3. 产生的Stage是否属于ShuffleMap类型

Partition确定需要产生多少Task，RDD的ShuffleMap类型判断来确定生成Task的类型：ShuffleMapTask还是ResultTask

####关于内部消息机制
Spark使用Actor Model实现内部消息传递。如果使用共享内存方式，则会由于同步锁的存在，产生复杂的死锁问题。

```
import akka.actor.Actor
import akka.actor.ActorSystem
import akka.actor.Props

...

```

Spark中的ShuffleMapTask和ResultTask，可以对应于Hadoop的Map和Reduce。

submitMissingTask负责创建新的Task。如果Stage中对应Task的isShuffleMap标记为真，则创建ShuffleMapTask，否则创建ResultTask。

属于同一个Stage的Task是可以并发执行的，而一个Stage中Task的数目则由Partition数量决定。  
需要注意的是并发不等于并行，并行数目的多少还要看Executor上实际空闲的内核资源数量。

---
任务类型和个数确定后，就会将这些任务发送到各Executor，再由Executor启动相应的线程执行。

###Executor执行任务
**TaskschedulerImpl** -> **ReviveOffers** -> **DriverActor** -> **makeOffers**

####makeOffers的处理逻辑
找到空闲的Executor，随机分发任务到各个Executor。利用launchTasks分发任务  
资源分配由resourceOffers控制，包括Task需要的依赖包和数据。  
依赖文件会保存在hdfs或指定的目录下。  


Task开始执行后，会发送LaunchTask消息给Executor，Executor使用launchTask对消息进行处理。  
但是如果Executor没有注册到Driver，那么即使接收到了LaunchTask，也不会执行任何操作。  


######ShuffleMapTask
TaskRunner.run -> Task.run -> Task.runTask -> RDD.iterator -> RDD.computeOrReadCheckpoint -> RDD.compute

执行后会返回MapStatus

######ResultTask
ResultTask.runTask没有明确的返回值

#####执行结果返回
Task执行时会有大量的数据交互，主要有三种类型：

 1. 状态相关， StatusUpdate等
 2. 中间结果
 3. 计量相关的统计数据 Metrics Data

Task执行完毕，会通过statusUpdate通知ExecuteBackend，结果保存在DirectTaskResult  

StatusUpdate -> SchedulerBackend -> TaskSchedulerImpl将任务转入完成队列，开始执行下一个任务 -> DAGScheduler.handleTaskCompletion根据Task的不同区别对待返回结果  
如果ResultTask执行成功，DAGScheduler会发出TaskSucceed来通知所有对任务执行情况有兴趣的监听者，如果JobWaiter。  
JobWaiter.taskSucceed根据当前已完成任务数之和是否等于事先提交的任务总数来判断是否整个作业执行结束。如果判定执行结束，则会把全局标识位_jobFinished置为true，并通知所有等待线程。

#####checkpoint和cache
 - Checkpoint将计算结果写入HDFS中，不会保存RDD lineage
 - Cache则会把数据缓存在内存中，并保存lineage，如果内存不足，则会写入磁盘

####WebUI
Spark程序启动时，会启动一个Jetty的web服务，默认地址是masterIP:4040，端口视配置而定(spark.ui.port)。可以在上面看到Spark的运行情况。

需要注意的是WebUI监听的统计数据会实时更新，但是不会自动更新到网页上，因此网页可能需要不时手动刷新。

####Metrics测量模块
由MetricsSystem担任，有以下三个重要概念:

 - Instance 表示谁在使用MetricsSystem，一直的有Master, Worker, Executor, Client Driver会创建MetricsSystem用于测量
 - Souce 数据源，从哪里获得数据
 - Sinks 数据目的地，将从Source获取的数据发送到哪里，Spark目前支持一下几种
  * ConsoleSink 输出到Console
  * CSVSink 定期保存到CSV文件
  * JmxSink 注册到JMX，通过JMXConsole查看
  * MetricsServlet 在SparkUI中添加MetricsServlet，用以查看Task运行时的测量数据
  * GraphiteSink 发送给Graphite以对整个系统(不止Spark)进行监控

Metrics子系统的配置文件在SPARK_HOME/conf/metrics.properties，默认的Sink是MetricsServlet。  
可以通过输入masterIP:4040/metrics/json获取JSON格式保存的Metrics信息。

###存储机制
ShuffleMapTask的结果会被作为ResultTask的输入读取。

ResultTask读取数据过程:

 1. ShuffleMapTask将计算的状态包装为MapStatus返回给DAGScheduler
 2. DAGScheduler将MapStatus保存到MapOutputTrackerMaster中
 3. ResultTask在调用shuffleRDD时会使用BlockStoreShuffleFetcher方法获取数据
  - 询问MapOutputTrackerMaster所要去的数据的location
  - 根据返回结果调用BlockManager.getMultiple获取真正的数据

#####MapStatus数据结构
 * 每个ShuffleMapTask都会用一个MapStatus保存计算结果。  
 * MapStatus由blockManagerid和byteSize构成
  - blockManagerid表示中间结果的实际数据存在哪个BlockManager
  - byteSize表示不同reduceid所要读取的数据大小

####Shuffle结果写入
写入过程：  
**ShuffleMapTask.runTask** -> **HashShuffleWriter.write** -> **BlockObjectWriter.write**

HashShuffleWriter.write会对数据进行聚合，合并相同key的value(相加或合并到同一集合中)，然后利用Partitioner函数决定<k, val>写入哪个文件

每个临时文件由(shuffle_id, map_id, reduce_id)决定，reduce_id由Partitioner计算得来，输入是元素的键值


####Shuffle结果读取
入口 ShuffleRDD.compute

ShuffleMapTask产生的MapStatus中含有当前ShuffleMapTask产生的数据落到各个Partition中的大小(byteSize)，如果为0，则表示没有数据产生。
byteSize的索引就是reduce_id(疑似)

######btyeSize如何用8位空间表示更大的数据大小
 - 使用1.1作为对数底，将\\(2^8\\)转换为\\(1.1^{256}\\)  
 即原本8位空间用来保存实际数据，现在用来保存`math.log(val)`的结果值
 表示的存储空间可以扩展到35G，误差最高10%

Shuffle_id唯一标识一个Job中的Stage，需要遍历该Stage中的所有Task产生的MapStatus，才能确定是否有当前ResultTask需要读取的数据

#####Spark内存消耗位置
 - ShuffleMapTask和ResultTask都需要将计算结果保存在内存中，再写入磁盘
 - ResultTask的combine阶段，利用HashMap缓存数据，如果数据量过大或Partition数目过多，都会消耗大量内存

####Memory Store 内存读写
主要由以下几个部分：
 - CacheManager RDD计算时的读写内存数据接口
 - BlockManager CacheManager实现读写数据的功能依赖模块，决定数据是从内存还是磁盘中获取
 - MenmoryStore 内存数据读写模块
 - DiskStore 磁盘数据读写模块
 - BlockManagerWorker 备份数据到其他节点，或在出错时从备份恢复数据
 - ConnectionManager 管理与其他节点的连接和数据的收发
 - BlockManagerMaster 只允许在Driver Application所在的Executor，记录BlockId存储在哪个SlaveWorker上，提供路由功能

#####数据写入过程
![数据写入内存过程](https://github.com/cowardfxn/notes/blob/master/img/memoryCache.png)

 1. RDD.iterator是与Storage子系统交互的入口
 2. CacheManager.getOrCompute调用BlockManager的put接口来写入数据
 3. 数据优先写入MemoryStore(内存), 如果内存已满，则将最近使用频率低的数据写入磁盘
 4. 通知BlockManagerMaster有新数据写入，在BlockManagerMaster中保存元数据
 5. 如果输入的数据备份数目大于1(参数设置为MEMORY\_ONLY\_2/MEMORY\_AND_DISK\_2)，则将写入的数据与其他Slave Worker同步

#####数据读取
BlockerManager.get

优先读取本地，如果找不到则读取远程数据

####Tachyon
Master-Worker分布的分布式文件系统，架构类似Spark，已被整合进Spark，可以直接调用，但是存储系统独立于Spark系统之外，因此不受Spark内部Job崩溃的影响，数据可以保留。

#####读取
`val file = textFile("tachyon://ip:port/path")`

#####写入
```
val file = sc.textFile("tachyon://ip:port/path")
file.persist(OFF_HEAP)
```
实际存储到Tackyon中的方法 *putInfoTachyonStore*

###部署方式
 - 单机
 - 伪集群
 - 独立集群/原生集群
 - YARN集群
 - Mesos

####单机模式
`MASTER=local spark-shell`

本地运行，Driver、Master、Worker、Executor都运行在同一个JVM进程中。
容错性最差。

 - local是单线程执行任务
 - local[*]会创建最高机器内核数目个线程执行任务，可以用`spark.default.parallelism`设定

####伪集群模式
`MASTER=local-cluster[2, 2, 512] spark-shell`
最后的512指内存设置，如果配置了spark-default.conf，则必须与其中的`spark.executor.memory`的值一致。

Master、Worker、Executor都运行在本机，但是。。。

 - Master和Worker运行于同一个JVM中，Executor单独运行
 - Master、Worker、Executor只能运行在同一台机器上，无法跨物理机运行

如果Executor出错，则Worker会重启Executor，但是如果Worker或Master出错，则整个Spark Cluster失效。

####原生集群 Standalone Cluster
![Standalone Cluster](https://github.com/cowardfxn/notes/blob/master/img/standAloneCluster.png)

集群规模不大时，可用于生产环境

Driver不能运行于Cluster内部，只能独立运行。
三种类型的节点，各自运行于独立的JVM进程中：

 - Master 主控节点，整个急群中最多只能有一个Master节点处于Active状态
 - Worker 工作节点，负责与Master交互，可以有多个
 - Executor 运行节点 直接被Worker控制，一个Worker可以启动多个Executor

![StandaloneCluster启动过程](https://github.com/cowardfxn/notes/blob/master/img/standAloneClusterExec.png)


#####启动Master
 1. 配置信息读取，MasterArguments
 2. 创建Actor


MasterArguments读取的环境变量包括：

 - spark\_master\_host 监听地址
 - spark\_master\_port 监听端口
 - spark\_master\_webui\_port webui监听端口

#####启动Worker
Worker运行时，需要注册spark-env.sh中配置的spark\_master\_ip、spark\_master\_port设定的Master URL。

Worker需要向Master回报所在机器的CPU核数(inferDefaultCores)和物理内存大小(inferDefaultMemory)，而如果与CPU和内存相关的环境变量存在，则会优先使用环境变量设定的值。

 - SPARK\_WORKER\_PORT 监听端口
 - SPARK\_WORKER\_CORES CPU Cores数目
 - SPARK\_WORKER\_MEMORY Worker可用内存
 - SPARK\_WORKER\_WEBUI\_PORT WEBUI监听端口
 - SPARK\_WORKER\_DIR Worker目录

Worker启动后会向Master发起注册，注册消息中包含本Worker Node的核数和可用内存。*preStart* -> *registerWithMaster* -> *tryRegisterAllMaster*

######Master收到RegisterWorker通知后处理
 1. 如果收到消息的Master处于Standby状态，则不作任何响应
 2. 判断是否重复的WorkerID，是则拒绝注册
 3. 如果以上两点皆不符合，则：
  - 读取注册的Worker信息并保存
  - 发送响应给Worker，确认注册成功
  - 调用Schedule函数，将已经提交但没有分配资源的Application分发到新加入的Worker Node

而Worker在收到Master的注册成功消息RegisteredWorker之后，会注册定时处理函数，定期向Master发送心跳消息SendHeartbeat，定期更新Master上存储的对应Worker节点的heartbeat时间。  
同时Master上也会启动一个定时器，定期对原本处于Alive状态的Worker进行状态判断，如果Worker最近一次更新状态的时间到当前时间的差值大于定时器时长，则认为该Worker没有发送心跳消息，不再存活。
实装逻辑里，Master上还会设定REAPER\_ITERATIONS，更新状态时间的差值大于多个定时器时长后，才会认为Worker不再存活。

**如果判定Worker已不再存货，则使用removeWorker函数通知DriverApplication**

Spark提供的启动Worker节点的脚本:  
`SPARK_HOME/sbin/start-slaves.sh`  
运行前提，运行Master和Worker的用户组和用户名要一致，否则Worker可能无法创建Executor

#####运行spark-shell
Executor是在Application被注册到Master时被连带启动的。

启动spark-shell命令  
`MASTER=spark://localhost:7077 spark-shell`

Standalone模式下，每个Application的log都被保存在SPARK\_HOME/works目录中。  

这个模式下，Master, Worker, Application Driver都运行在独立的JVM进程中。而SparkSubmit则与Application Driver运行于同一个进程。

######SparkSubmit调用关系
SparkSubmit -> SparkDeploySchedulerBackend -> AppClient(专门用于与Master交互) -> tryRegisterAllMasters

######Application分发原则
Worker分发Application有两种原则:

 - 尽可能将任务分发到各个Worker Node  
实现方式：每次在各个Worker Node上分配一个空闲的Core，然后分配Application
 - 将任务分发到尽可能少的Worker Node
实现方式：一次在某个节点上占用尽可能多的空闲Core，然后再分配Application

如果不加限定，一个Application可以占用集群的Core数目为Integer.MAX_VALUE，因此最好加以限定。使用`spark.cores.max`指定每个Application占用的最大CPU Core数目。

######Application运行结束判断
######Executor应对
Application Driver退出时，*CoarseGrainedExecutorBacked*会收到系统通知DisassociatedEvent，Executor会认为Application Driver已经退出，然后主动退出程序执行。

######Master应对
Master也会收到DisassociatedEvent，然后将注册上来的Application删除。


在Standalone Cluster模式下，Executor的启动参数受控于Driver机器上的SPARK_HOME/conf/spark-defaults.conf文件配置。  
而如果在Driver机的配置文件中，spark.executor.memory指定的比实际分配到的Worker上的可用内存大，则无法为提交的Application创建任务Executor。

#####Standalone模式下Cluster启动流程
 1. 启动Master，Master启动完毕后会等待新的的Application提交上来
 2. 启动Worker，启动后向Master发起注册，注册成功后定期向Master发送心跳
 3. 如果有新的Application提交给Master，Master会根据资源使用情况要求Worker启动相应的Executor
 4. 新启动的Executor注册到Applciation中的Driver，定期发送心跳消息
 5. Application中的SchedulerBackend将作业中的Task分配到各个注册上来的Executor上执行

#####容错性
 1. Worker异常退出
  - Worker在退出前，会通过预先设定的shutdownHook将Worker下的所有Executor关闭
  - Master在发现Worker的心跳超时，认为Worker节点已阵亡，将这个消息报告给相应Driver，消息中还包括失联Worker下的Executor信息，通知Application Driver相应的Executor已失联。另外一种保障是，Executor在关闭后，Application Driver与Executor的连接无法继续，Application Driver会收到DisassociatedEvent，表明Executor已失联。

 2. Executor异常退出
  - ExecutorRunner会发现异常，然后通过ExecutorStatusChanged汇报给Master
  - Master收到通知后，向Worker发送重新启懂Executor的指令
  - Worker收到LaunchExecutor指令，重启Executor

 3. Master异常退出
  - 下属Worker的Executor无法在出错之后重启
  - 即使任务结束，所占用的资源也无法释放，因为释放资源的指令由Master发出
  - 如果Client只有一个Master，则此时Job失败
  - 解决办法：部署备用Master节点
使用ZooKeeper管理，当Active Master异常退出时，启动StandBy的Master节点

![主备双Master部署模式](https://github.com/cowardfxn/notes/blob/master/img/zooKeeperModel.png)

######ZooKeeper配置
在conf/spark-env.sh中，为SPARK\_DAEMON\_JAVA\_OPTS添加如下项目

配置项 | 说明
:------|:-----
spark.deploy.recoveryMode | 是否支持ZooKeeper备机方案，默认值为NONE
spark.deploy.zookeeper.url | ZooKeeper集群的URL地址(ip1:port1, ip2:port2, ...)
spark.deploy.zookeeper.dir | ZooKeeper存储reocovery state的目录

SPARK\_DAEMON\_JAVA\_OPTS配置实例：
`SPARK_DAEMON_JAVA_OPTS="SPARK_DAEMON_JAVA_OPTS -Dspark.deploy.recoveryMode=ZOOKEEPER"`

ZooKeeper模式运行命令实例：
`MASTER=spark://ip1:port1,spark://ip2:port2,spark://ip3:port3 spark-shell`

####SparkOn YARN
YARN由三大功能模块组成：

 - RM ResourceManager
 - NM NodeManager
 - AM ApplicationMaster

#####YARN作业提交流程
 概述：用户通过Client向ResourceManager提交Application，ResourceManager根据用户请求分配合适的Container，然后在指定的NodeManager上运行Container以启动ApplicationMaster。  

详细：  

 1. ApplicationMaster启动后需要先向ResourceManager注册自己
 2. 对于用户的Task，ApplicationManager需要先与ResourceManager协商以获取运行Task所需的Container，然后，ApplicationMaster将任务发送给指定的NodeManager
 3. NodeManager启动相应的Container，运行用户的Task

![部署YARN应用的流程](https://github.com/cowardfxn/notes/blob/master/img/yarnWorkFlow.png)

编写YARN Application时，主要实现的是Client和ApplicationMaster。


#####Standalone vs. YARN
Standalone | YARN
:---------- | :-------
Client | Client
Master | ApplicationMaster
Wroker | ExecutorRunnable
Scheduler | YarnClusterScheduler
SchedulerBackend | YarnClusterSchedulerBackend
Executor 由Wroker启动/重启 | Executor 由NodeManager启动/重启

#####各模块启动顺序
 1. ApplicationMaster作为应用入口最先启动
 2. 向RM申请Container
 3. 申请成功后向NM发送启动Container指令
 4. 在ApplicationMaster中启动监听线程，监控ExecutorContainer运行
**如果失效的Container数目没有超过最大阈值，则重启失效的Container，否则判断整个应用执行失败，退出。**

####安装Hadoop
 1. 创建用户组和用户  

    ```
    groupadd hadoop
    useradd -b /home -m -g hadoop hduser
    ```

 2. 切换hadoop用户，下载并解压Hadoop运行版
 3. 设置环境变量

    ```
    export HADOOP_HOME=$HOME/hadoop-2.4.0
    export HADOOP_MAPRED_HOME=$HOME/hadoop-2.4.0
    export HADOOP_COMMON_HOME=$HOME/hadoop-2.4.0
    export HADOOP_HDFS_HOME=$HOME/hadoop-2.4.0
    export HADOOP_YARN_HOME=$HOME/hadoop-2.4.0
    export HADOOP_CONF_DIR=$HOME/hadoop-2.4.0/etc/hadoop
    ```
 4. 创建HDFS相关目录，namenode和datanode等

    ```
    mkdir -p $HOME/yarn_data/hdfs/namenode
    mkdir -p $HOME/yarn_data/hdfs/datanode
    ```
 5. 修改Hadoop配置文件
  * `$HADOOP_HOME/etc/hadoop/yarn-site.xml`
  
        ```
        修改原configuration标签
        <configuration>
        <property>
            <name>yarn.nodemanager.aux-services</name>
            <value>mapreduce_shuffle</value>
        </property>
        <property>
            <name>yarn.nodemanager.aux-services.mapreduce.shuffle.class</name>
            <value>org.apache.hadoop.mapred.ShuffuleHandler</value>
        </property>
    </configuration>
        ```
        
  * `$HADOOP_HOME/etc/hadoop/core-site.xml`
      
      ```
      <property>
        <name>fs.default.name</name>
        <value>hdfs://localhost:9000</value>
        <!-- YarnClient会用到该配置项 -->
      </property>
      ```
  * `$HADOOP_HOME/etc/hadoop/hdfs-site.xml`
  
      ```
      <property>
          <name>dfs.replication</name>
          <value>1</value>
      </property>
      <property>
          <name>dfs.namenode.name.dir</name>
          <value>file:/home/hduser/yarn_data/hdfs/namenode</value>
          <!-- 节点格式化中用到 -->
      </property>
      <property>
          <name>dfs.datanode.data.dir</name>
          <value>file:/home/hduser/yarn_data/hdfs/datanode</value>
      </property>

      ```
  
  * `$HADOOP_HOME/etc/hadoop/mapred-site.xml`
  
      ```
      <property>
          <name>mapreduce.framework.name</name>
          <value>yarn</value>
      </property>
      ```

 6. 格式化namenode
 
  ```
  bin/hadoop namenode -format
  ```
  
 7. 启动namenode
 
 ```
 sbin/hadoop-daemon.sh start namenode
 ```
 
 8. 启动datanode

 ```
 sbin/hadoop-daemon.sh start datanode
 ```
 
 9. 启动ResourceManager(RM)
 
 ```
 sbin/yarn-daemon.sh start resourcemanager
 ```
 
 10. 启动NodeManager(NM)
 
 ```
 sbin/yarn-daemon.sh start nodemanager
 ```
 
 11. 启动Job History Server
 
 ```
 sbin/mr-jobhistory-daemon.sh start historyserver
 ```

###Spark Streaming

```
org.apache.spark.streaming._
org.apache.spark.streaming.StreamingContext
```

######实时数据流
 - 数据一直处在变化中
 - 数据无法回退
 - 数据一直源源不断地涌进

####DStream
Discretized Stream，Spark Streaming处理实时数据流的基本数据结构。  

Spark Streaming处理实时数据流的处理思路：

 1. **数据持久化** 先将网络上接收的数据保存起来，以备后续处理出错时恢复用
 2. **离散化** 按时间分片划分数据流，一段时间内的数据为一个处理单元
 3. **分片处理** 分批处理经过离散划分的数据

![DStream与RDD的对应关系](https://github.com/cowardfxn/notes/blob/master/img/rdd2dstm.png)

DStream由各个时间片数据的RDD组成，在API角度，DStream对RDD进行了一层封装，大部分的RDD operation都有对应的DStream方法定义。  

类似RDD的Transformation和Action，DStream上的Operation也分为两类：

 - Transformation 转换操作
 - Output 输出结果，如print, saveAsObjectFiles, saveAsTextFiles, saveAsHadoopFiles


Spark Streaming主要由三个模块构成：

 - Master 记录DStream间的依赖关系，并负责任务调度以生成新的RDD
 - Worker 从网络接收数据，存储并执行RDD计算
 - Client 负责向Spark Streaming中灌入数据(Consumer?)

####编程接口
用户对DStream的操作通过StreamingContext完成  
在指定DStream间的转换关系后，通过StreamingContext.start函数来真正启动运行。

####Spark Streaming执行过程
Spark Streaming内部实现的分析步骤：

 1. 主要部件的初始化过程
 2. 网络侧接收到的数据如何存储到内存
 3. 如何根据存储下来的数据生成相应的Spark Job

#####初始化过程
StreamingContext最主要的入参是以下三个：

 1. SparkContext 任务最终通过SparkContext接口提交到Spark Cluster运行
 2. Checkpoint 检查点，缓存中间结果用
 3. Duration 根据多少时长创建一个batch(使用获取的数据进行定义好的运算)


而StreamingContext最主要的成员变量作用如下：

 - **JobScheduler** 用于定期生成SparkJob
 - **DStreamGraph** 包含DStream间依赖关系的容器
 - **StreamingTab** 用以Spark Streaming运行作业的监控

Streaming作业的提交和执行过程如图：  
![Streaming作业的提交和执行过程](https://github.com/cowardfxn/notes/blob/master/img/jobRun.png)

#####数据接收
ssc.start被执行之后，会调用JobScheduler.start函数，由JobScheduler一次启动三个功能模块：**监控模块**，**数据接收模块**，**启动定期生成Spark Job的JobGenerator**

接收数据的Receiver运行在Worker机器上的Executor的JVM进程中，而非Driver Application的JVM内。

#####数据处理
DStreamGraph记录输入的DStream和输出的DStream。  
其中，InputDStream用来解决启动接收数据函数的问题，OutputDStream则用于生成Spark Job。

OutputDStreams中的元素是在有Output类型的Operation(print、saveAsObjectFile等)作用于DStream上时自动添加到DStreamGraph中的，与InputDStream的一个重要区别就是OutputDStream会重载generateJob。  
而从代码实现层面来说，InputDStream属于控制层面(Control Panel)，OutputDStream属于数据层面(Data Panel)

Streaming数据接收的控制层面流程大致如图：  
![控制层面流程](https://github.com/cowardfxn/notes/blob/master/img/controlPanel.png)

 1. 数据真正接收是发生在SocketReceiver.receive中，将接收到的数据放入BlockGenerator.currentBuffer
 2. BlockGenerator中有一个重复定时器updateCurrentBuffer，updateCurrentBuffer将当前buffer中的数据封装为一个新的Block，放入blocksForPush队列
 3. BlockGenerator.BlockPushingThread会不停的将blocksForPush队列中的成员通过pushArrayBuffer函数传递给BlockManager，让BlockManager将数据存储到MemoryStore中
 4. pushArrayBuffer还会将已被BlockManager存储的Block的id传递给ReceiverTracker，ReceiverTracker会将存储的blockId放到对应的StreamId队列中


接收到的数据转换为Block的过程

 1. 首先new message被放入blockManager.currentBuffer
 2. 定时器超时处理过程。将整个currentBuffer中的数据打包成一条BlockManager，放入ArrayBlockingQueue，支持FIFO
 3. keepPushingBlocks将每一条Block(包含时间戳和接收到的原始数据)让BlockManager进行保存，同时通知ReceiverTracker已经将哪些Block存储到了BlockManager中
 4. ReceiverTracker将每一个Stream接收到但还没有进行处理的Block放入receivedBlockInfo，使用的数据结构是Hashmap。在后面的generateJobs中会从receivedBlockInfo中提取数据以生成相应的RDD

总结：
 - 用time作为关键字，取出在当前时间之前加入的所有blockIds
 - 真正提交运行的时候，RDD中的blockfetcher以blockId为关键字，从BlockManagerMaster获取接收的原始数据

最终Job执行时，生成的Task数目与对应的Duration中获得的输入，生成的Block数目相当。

####窗口操作
Streaming的window操作都需要两个必要的参数：窗口的长度和窗口滑动的间隔，两者都必须是初始化ssc时定义的Duration的整数倍  
窗口的长度定义了在触发Job时单个切片的长度，也可以说是Block的数目  
窗口滑动间隔则是在Duration的基础上，定义了窗口的"*Duration*"

####容错性分析

 - Master节点挂掉 Master重启后，会再次主动创建Receiver，将Receiver派发到某一Executor上，但是在重启之前时间传递的数据，由于未读入系统，则会丢失
 - Worker挂掉
  * 如果Worker节点上运行了Receiver，则可能丢失数据
  * 如果Worker节点上未运行Receiver，则无影响
 - Driver挂掉 重启之后会通过Checkpoint Data恢复退出前的场景，数据不会丢失

如果最终结果的保存方式存在被重复写入的可能，那么无法保证结果数据是否被重复计算，不能达到exactly-once的效果。

####Storm

Storm的主要节点：

 - Client 提交应用，类似Spark的SparkSubmit
 - Nimbus Master节点，兼具Spark中Driver和Master的功能
 - Supervisor 监控Worker进程，类似Spark中的Worker
 - Executor 具体运行各个任务的线程，类似Spark中的TaskRunner

Strorm依靠ZooKeeper来维护整个集群，集群间的消息传递使用ZeroMQ，0.90版之后使用Netty作为进程间通信组件。

####Storm vs. Spark Streaming

特征 | Storm | Spark Streaming
:------ | :------ | :-------
处理模型 | record-at-a-time | 批量处理
消息获取模式 | push | pull
延迟 | Sub-second | few second
吞吐量 | 低 | 高
exactly-once | 通过Trident Topology支持 | 支持
Cluster Rebalance | 支持 | 不支持
集群管理 | ZooKeeper | Akka
实现语言 | Clojure | Scala
API支持的语言 | Clojure, java | Scala, Java, Python
并发数动态可调 | 支持 | 不支持
社区活跃程度 | 活跃 | 活跃
大公司支持 | Hortonwork | Cloudera

总结：**在实时性上Storm更优一些，Spark则在吞吐量上更胜一筹**。

###Spark SQL
通用的SQL三大模块，parser、optimizer和executor。  

最早的Spark平台上的SQL接口是Shark，但在功能被并入SparkSQL后，Shark被停用。  

####SqlParser
整个SQL部分代码大致分类如图所示
![SQLOnSpark](https://github.com/cowardfxn/notes/blob/master/img/sqlOnSpark.png)

处理顺序如下：

 1. SqlParser生成LogicalPlan Tree
 2. Analyzer和Optimizer将各种Rule作用于LogicalPlan Tree
 3. 最终优化生成的LogicalPlan生成SparkRDD
 4. 将生成的RDD交由Spark执行

一般来说，Spark每支持一种应用开发，都会引入一个新的Context及相应的RDD，对于SQL来说，引入的就是SQLContext和SchemaRDD。  

第一步，parseSql(sqlText)负责生成LogicalPlan，负责解析SQL语句，从SQL语句文本生成对应的Unresolved LogicalPlan。  
然后通过Analyzer将Unresolved LogicalPlan转换为Resolved LogicalPlan。实际上，第一步的作用就是找到Analyzer的触发点。

####Optimizer
对Analyzer生成的LogicalPlan进行优化，逻辑类似LogicalPlan

####SparkPlan
使用经过Optimizer优化后的LogicalPlan生成SparkRDD

> SparkSQL支持使用Parquet文件和JSON文件作为数据源，也支持将SchemaRDD中的内容保存为Parquet文件。

####Hive
由Facebook出品，最初是被用于帮助熟悉SQL的数据分析师使用HDFS数据。

#####架构
 - Table 表，类似SQL数据库中的表，每个表都有一个对应的HDFS目录，表中的数据经过序列化后存在该目录中。Hive也支持将数据存在NFS或本地文件系统中。
 - Partition 分区，类似RDBMS中的索引功能，每个Partition都有一个对应的目录，在查询时有助于减少数据规模。
 - Bucket 桶，数据分区之后，每个分区仍可能有相当大的数据量，这是，按照关键字的Hash结果将数据分成多个Bucket，每个Bucket对应于一个文件。

Hive支持类似SQL的查询语言，HiveQL，有DDL(Data Definition Language)、DML(Data Manipulation Language)、UDF(User Define Function)等三种类型。

Hive的整体架构可以分为以下几大部分：

 - 用户接口支持CLI、JDBC和WebUI
 - Driver 负责将用户指令转化为相应的MapReduce Job
 - MetaStore 元数据存储仓库，默认使用Derby存储引擎。数据库和表定义等内容就属于元数据。

![Hive架构](https://github.com/cowardfxn/notes/blob/master/img/hiveStructure.png)

#####HiveQL On MapReduce执行过程
 1. Parser 将HiveQL转化为相应的语法树
 2. Semantic Analyser 语义分析
 3. LogicalPlan Generating 生成相应的LogicalPlan
 4. QueryPlan Generating 生成QueryPlan
 5. Optimizer 查询优化器
 6. 生成MapReduce Job，提交给Hadoop运算框架执行

####Hive On Spark
HiveQL需要MapReduce过程，运行时间过长。解决办法是在HiveQL的Optimizer阶段，不生成MapReduce任务，而是生成Spark Job，使用Spark来真正执行。

SparkSQL与HiveQL执行过程对比  
![sqlVsHql](https://github.com/cowardfxn/notes/blob/master/img/sqlVsHql.png)

通过对比可以发现，源码分析时的关键点在于：

 - Entrypoint HiveContext.scala
 - QueryExecution HiveContext.scala
  * parser HiveQL.scala
  * optimizer

而HiveQL的转化过程中，使用到的数据包括：

 - **Schema Data** 元数据，数据库等一和表结构等，存储于MetaStore中
 - **Raw Data** 要分析的文件本身，输入数据

####Hive On Spark环境搭建
需要搭建Hadoop集群，也就是常用的Spark on Hadoop集群的部署方式。  
[Hive On Spark环境搭建](https://github.com/cowardfxn/notes/blob/master/hiveOnSpark.md)

###GraphX
对网络结构的抽象，通常表示为G = (V, E)，由顶点集合V和边集合E构成的一种数据结构，用来描述网络内各个实体的特征和关联关系。  
用顶点来记录实体的特征属性，用边来表征实体之间的关联关系。  

#####GraphX特点

 - 基于Spark核心模块实现 GraphX中图的基本要素EdgeRDD和VertexRDD都是基于RDD实现，具有RDD的一般特征，可以分别存储、计算，同时也可以进行一些特殊操作，入边变换、边过滤、内连接等。
 - 统一的数据模型抽象和高效的数据操作 GraphX是基于属性图模型的高层抽象，并提供了相应的数据操作接口，便于开发者对图形进行统一高效的变换操作。
 - 支持Pregel编程接口 GraphX基于Pregel这个基本的图计算处理模型实现，基础的计算单元是超步(SuperStep)
 - 良好的可扩展性

#####应用场景
 - 节点影响力计算 PageRank 网页排名等
 - 图数据搜索
 - 社交圈识别
 - 标签传播 根据标签进行内容推荐等

####图处理技术
#####数据模型
属性图  
由顶点和边构成，包括

 - 顶点与顶点的属性集合 顶点实体
 - 边与边的属性集合 顶点间的关系

#####数据存储
GraphX存储图数据基于RDD的数据存储和设计，存储特性遵循RDD数据的一些基本特性，如持久化、可分割性、依赖性、容错性等。

#####数据分割
为了实现集群中高效的并行处理效果，需要尽可能的降低分布式处理的各个子图间的耦合程度。  
有效的图分割是实现解耦的重要手段，将一个大图分割为若干小图，主要原则是：

 - 提高子图内部的连通性，降低子图间的连通性
 - 考虑子图规模的均衡性，尽量保证各个子图数据规模均衡，不出现较大的倾斜，从数据规模上防止各并行任务执行时间相差过大，降低任务同步控制的影响

常用的图分割策略有两种：

 * 边分割 保持顶点在各节点分布均匀，并采用顶点复制策略保证跨节点的边数目最小
   - 增加了邻接节点和边的存储开销以及同步通信开销
 * 点分割 保持个节点边的均匀分布，采用顶点复制策略维持各个边的邻接顶点信息
  - 能够减少跨节点数据通信，在解决超级节点时可以起到较好的作用

####Pregel计算模型
#####数据同步机制
**BSP** (Bulk Synchronous Parallel Model) BSP同步栅栏模型

 - 一个作业由一系列的超步组成
 - 在各个节点中，每个节点执行本地计算，在该超步结束前通过消息传递机制在各个节点间进行消息交互
 - 如果超步中的存在有消息交互未完成的节点，则所有节点同步等待，否则进入下一个超步

![同步栅栏模型](https://github.com/cowardfxn/notes/blob/master/img/bspModel.png)

在每个超步中，针对参与计算的节点执行相同的处理函数，该处理函数由用户定义，大致逻辑如下：

 1. 读取在超步S - 1发生给本节点的消息
 2. 更改顶点自己的状态和以自己为源点的边
 3. 发送消息给相邻节点，这些消息在超步S + 1被相邻节点接收

判断当前超步整个计算都已完成的标准是，所有顶点都已经进入“非活跃状态”，否则就等待节点执行。

####GraphX图计算框架分析
#####VertexRDD
继承自RDD，加入顶点属性信息，VertexID表示顶点ID，唯一的，可以用于快速检索需要的顶点  
VertexRDD的主要方法有以下几种：

 - filter 类似RDD的filter方法，本质上调用RDD的mapPartition操作，对RDD的每个partition进行函数运算，返回新的RDD
 - mapValues 对顶点属性进行的操作
 - diff 对比两个VertexRDD，返回两个集合中不同的元素构成的VertexRDD
 - leftJoin 类似数据库的左连接
 - innerJoin 类似数据库的innerjoin
 - aggregateUsingIndex 对具有相同ID的VertexRDD元素进行reduceFunc操作

#####EdgeRDD
EdgeRDD内的边通过分块组织进行管理，具体分割策略由PartitionStrategy指定  
每个partition中边的属性信息和邻接信息分块存储，便于属性的动态更新  
除RDD的基本操作外，EdgeRDD还有3个接口函数：

 - mapValues
 - reverse 对EdgeRDD中所有的边进行反转操作
 - innerJoin 连接两个EdgeRDD，要求两个EdgeRDD有相同的PartitionStrategy

#####EdgeTriplet
边点三元体 顶点和边的结合  
对Edge[ED]进行了一层封装，加入了边的源节点和目标节点属性  
使图的数据遍历操作更为方便

#####图的加载与构建
GraphX提供了几类方法来构建图结构数据：

 - GraphLoader.edgeListFile 从二维边结构数据创建图，加载邻接表，每一行表示一条边，行中数字表示边的两个顶点
 - Graph.apply 通过传入VertexRDD和EdgeRDD来构建图
 - Graph.fromEdges 由边集合构建图，边类型需要时RDD[Edge[ED]]
 - Graph.fromEdgeTuples 由通过顶点ID标示的边来构建图，rawEdges参数的类型是RDD[(VertexId, VertexId)]，与上面直接传入Edge对象的方法不同

#####图数据存储与分割
GraphX采用的图分割策略是顶点分割，把图中的边尽可能均匀的分散在各个节点，而允许顶点跨节点存在，减少通信和存储代价  
具体的边分割策略由PartitionStrategy决定，也可通过Graph.partitionBy接口指定，默认的是基于边初始的划分方法进行分割的。

GraphX中目前有以下几种分割策略：

 - EdgePartitionID 根据源的VertexID和partitionID进行随机分配，具有相同源顶点的边会被划分到同一节点  
具体的分配算法为：

    ```
    val mixingPrime: VertexId = 1125899906842597L
    (math.abs(src) * mixingPrime).toInt % numParts
    ```
mixingPrime主要用来增加分配过程的随机性和均匀性
 - EdgePartition2D 能够将边划分至N个节点，保证顶点的复制份数小于$$2^{sqrt(numParts)}$$，同时尽可能保证边分布的均匀性，从而保证计算负载的均衡  
主要分割策略如下：

    1. 获取分配矩阵的平方因子
        
        ```
        val ceilSqrtNumParts: PartitionID = math.ceil(math.sqrt(numParts)).toInt
        ```
        ceilSqrtNumParts是2的整数次幂，保证在对源顶点和目标顶点随机化的过程中，其分配的复制份数不会超过$$2^{sqrt(numParts)}$$
    2. 将源顶点和目标顶点的ID随机化  
    通过引入一个mixingPrime常量，增加对col和row分配的随机性和均匀性
    
        ```
        val mixingPrimeL VertexId = 1125899906842597L
        val col: PartitionID = (math.abs(src * mixingPrime) % cellSqrtNumParts).toInt
        val row: PartitionID = (math.abs(dst * mixingPrime) % cellSqrtNumParts).toInt
        ```
    3. 均匀分配至numParts个数据块
    
        ```
        (col * ceilSqrtNumParts) % numParts
        ```
 - RandomVertexCut 根据源顶点和目标顶点构成的边进行Hash编码，在对分割数numParts进行取余运算  

    ```
    math.abs((src, dst).hashCode()) % numParts    
    ```
    > 疑代码未贴全，最后的“ % numParts”为自补
 - CanonicalRandomVertexCut 与RandomVertexCut类似，只是在hash编码前进行顶点值排序，将源顶点和目标顶点中，ID小的排在前，大的排在后。然后将升序构成的边对分割数numParts进行取余运算，得到相应的Partition

    ```
    val lower = math.min(src, dst)
    val higher = math.max(src, dst)
    math.abs((lower, higher).hashCode()) % numParts
    ```
    
#####操作接口
GraphX中的属性图graph也有一些基本操作的API接口，如属性变化、结构操作、连接操作、邻接操作、缓存操作等。

 - **属性变换** 通过map对graph的顶点和边进行属性变换操作，产生变换后的新图，接口有*mapVertices*、*mapEdges*、*mapTriplets*
 - **结构操作** 对图的顶点和边进行过滤，接口包括:
  * *reverse* 对图中所有的有向边进行翻转操作，不改变顶点和边的所有属性。可以用来进行反向PageRank计算
  * *subgraph* 对graph进行信息过滤和提取，返回满足指定条件的子图，类似RDD中的filter方法
  * *mask* b.mask(a) 将a、b两图进行对比，返回与a具有相同顶点和边的子图
  * *groupEdges* 对边进行和并操作，合并重复边或对两条边上的权值进行合并计算等
 - **连接操作** 类似数据库中的连接操作，通过关联属性获得其他有用的属性信息，常用接口包括两类：
  * *joinVertices* 利用外部数据与原有数据进行合并，类似逻辑与运算
  * *outerJoinVertices* 理由外部数据源更新当前顶点的属性，是对已有属性的替换

######Pregel源码实现
Pregel的定义文件是Pregel.scala，入口函数是apply。

#####PageRank
计算网页链接价值的算法，属于Google专有的。

######核心思想
 1. 网页之间的关系用连接图表示
 2. 两个网页之间的连接关系表示任意用户从一个网页找到另一个的概率
 3. 所有网页的排名最后保存在一个一维向量中

所有网页之间的连接关系用矩阵A表示(这将是一个非常庞大的矩阵)，所有网页的排名用矩阵B表示(一维矩阵)  
$$B_{i} = A \times B_{i-1}$$
> $$B_{i}$$ 当前迭代  
> $$B_{i-1}$$ 前次迭代  
> 初始认为所有网页排名都是$$\frac{1}{N}$$，即$$B_{0}=(\frac{1}{N}, \frac{1}{N}, ..., \frac{1}{N})$$，以此为初始条件开始迭代。当两次迭代的差异非常小，接近于0时，迭代结束

相比整个网络中网页数量之和，网页之间的连接数量非常小，计算单个网页的排名时需要对0或者非常小的概率进行平滑处理，利用一个非常小的常数$$\alpha$$，上述公式演化为：  
$$B_{i} = \left [ \frac{\alpha}{N} \cdot I + \left (1 - \alpha \right )A \right ] \cdot B_{i-1}$$


要实现PageRank算法，在Pregel的接口中，需要用户自定义的函数有三个：

 - vertexProgram
 - sendMessage
 - messageCombiner

参考代码*PageRank.run*。似乎GraphX有相关的示例代码。

###MLLib
机器学习

####线性回归(Linear Regression)
######线性回归模型  
$$Y = X\beta + \epsilon$$

$$Y$$是一个包括了观测值$$Y_{1}, ..., Y_{i}$$的列向量，$$\epsilon$$是包括了未观测的随机向量$$\epsilon_{1}, ..., \epsilon_{n}$$(误差)  
$$X=\begin{pmatrix}
1 & x_{11} & {...} &x_{1p} \\ 
1 & x_{21} & {...} &x_{2p} \\ 
{...}  & {...} & {...} &{...} \\ 
1 & x_{n1} & {...} & x_{np}
\end{pmatrix}$$

######参数求解
最小二乘法 计算最小误差的平方和(方差?)  
过程是计算对每个样本的x的最小误差$$\mu(x)=\mu(x_{i};\alpha_{1}, \alpha_{2}, ..., \alpha_{k})$$，然后对结果求和：  
$$S= \sum_{i=1}^n[y_{i} - \mu(x)=\mu(x_{i};\alpha_{1}, \alpha_{2}, ..., \alpha_{k})]^2$$

再求得使以上方程的值$$S$$最小的$$\alpha_{1}, \alpha_{2}, ..., \alpha_{k}$$

#####梯度下降法(Gradient descent)
原理：如果实值函数$$F(X)$$在点a出可微且有定义，那么函数$$F(X)$$在a点沿着梯度相反的方向$$-{\Delta}F(a)$$移动时，下降最快，最终将达到一个X的最优解，使改点的梯度等于0，让X值无论如何移动，$$F(X)$$的值都在一个确定的范围内，而不会超出。

缺点：可能只找到局部最优解，无法区分局部最优解与全局最优解

######算法实现
对于输入样本集$$x^{(i)}, y^{(i)}$$，i=0, 1, ..., m(即m个样本)，其中$$x^{i}=[x_0^i, x_1^i, ..., x_n^i]^T$$(即n个特征)  
拟合(预测)函数为:  
$$h(x)=\sum_{i=0}^n\theta_iX_i=\theta^Tx$$

目标函数(误差和函数)为：  
$$J(\theta)=\frac{1}{2}\sum_{i=1}^m(h_{\theta}(x^{(i)})-y^{(i)})^2$$

需要做的就是找出一组$$\theta=[\theta_0, ..., \theta_n]^T$$，使$$J(\theta)$$最小

计算过程：

 - 随机选取参数向量$$\theta$$的初始值
 - 更新每个参数$$\theta_j（j\in[0, n]]）$$的值：  
    $$\theta_j := \theta_j - {\alpha}\frac{\partial}{\partial\theta_j}J(\theta)$$  
将$$J(\theta)$$代入上式，则有：  
$$\theta_j := \theta_j + {\alpha}\sum_{i=1}^m(y^{(i)}-h_{\theta}(x^{(i)}))x_{i}^{(i)}$$ (for every j)  

    * 由于该算法每次更新一个$$\theta$$中的元素，而且需要处理整个样本集合，因此也被称作**批量梯度下降(batch gradient descent)**  
    * 将计算得到的新的$$\theta$$更新后代入$$J(\theta)$$，直到$$J(\theta)$$的值收敛于某一范围后，结束迭代

特点：

 - 可能会收敛于局部最小值
 - 靠近极小值范围时，每次迭代的进展会变的很小，优化速度回变慢
 - 每次更新都需要处理整个样本集，对于大量数据来说，计算速度较慢

#####随机梯度下降(Stochastic graident descent)
与梯度下降算法基本类似，只是在更新参数向量$$\theta$$时，每次只更新其中一个参数。  
更新$$\theta_j$$的表达式如下：  
$$\theta_j := \theta_j + {\alpha}(y^{(i)} - h^{\theta}(x^{(i)}))x_{j}^{(i)}$$

#####数据正则化
使用简单的线性回归处理复杂数据时，会有些问题

 - 稳定性与可靠性 样本数据集合是奇异的，无法求得逆矩阵；样本集合数据量与特征数目相当(也可理解为样本数据太少而特征数目太多)，容易产生过拟合
 - 模型解释能力的问题 某些特征有内在联系，可能会影响线性回归计算结果

解决方法：

 - 子集选择 使用样本数据集的子集进行计算，包括逐步回归和最优子集法等
 - 收缩方法 设定某些特征对应的参数向量为0，去除他们对计算结果的影响。又称正则化(regularization)，主要是岭回归(ridge regression)和lasso回归
 - 维数缩减 主成分回归(PCR)和偏最小回归(PLS)的方法。把p个特征投影到m维空间(p < m)，利用投影得到的不相关数据建立线性模型

#####代码实现
`org.apache.spark.mllib.regression.LinearRegressionWithSGD`  
调用过程：  
LinearRegressionWithSGD.train -> LinearRegressionWithSGD.train -> optimizer.optimize -> GradientDescent.runMiniBatchSGD

> 疑似印刷有误，待更正

计算过程中使用了Breeze库，Breeze、Epic及Puck是scalanlp的三大支柱性项目，参考 [scalanlp](www.scalanlp.org)

####分类算法
#####逻辑回归(Logical Regression)
适用于二值分类问题，即结果非彼即此的分类

假设函数(hypothesis):  
$$h_{\theta}(x) = g(\theta^{T}x) = \frac{1}{1 + e^{-\theta^{T}x}}$$

分类结果必须满足伯努利分布：  
$$P(y=1|x;\theta) = h_{\theta}(x)$$  

$$P(y=0|x;\theta) = 1 - h_{\theta}(x)$$  

损失函数(cost function)采用对数损失函数或对数似然损失函数：  
$$L(Y, P(Y|X)) = - \log{P(Y|X)}$$

$$L(h_{\theta}(x), y) = \begin{Bmatrix}
y=1; -\log(h_{\theta}(x)) \\ 
y=0;-\log(1-h_{\theta}(x^{(i)}))
\end{Bmatrix}$$

$$J(\theta) = \frac{1}{m}[\sum_{i=1}^m y^i \log h_{\theta}(x^{(i)}) + (i-y^{i})\log(1-h_{\theta}(x^{(i)}))]$$

对cost function求各个$$\theta$$的偏导数，可以得到类似线性回归时的梯度公式：  
$$\frac{\partial }{\partial \theta_i} = \frac{1}{m}\sum_{i=1}^m L(h_{\theta}(x^{(i)} - y^{(i)}))x^{(i)}$$

可以发现与线性回归的迭代求解公式在形式上完全相同。  
线性回归与逻辑回归二者的区别主要是在假设函数上。

算法 | 假设函数(Hypothesis)
:---- | :--------
线性回归 | $$y^i = \theta^T x^i + \epsilon^i$$
逻辑回归 | $$h_{\theta}(x) = g(\theta^{T}x) = \frac{1}{1 + e^{-\theta^{T}x}}$$

######代码实现
LogisticGradient

#####支持向量机(SVM)
原理复杂，不在此详述  
代码入口: HingeGradient

####拟牛顿法
基本思想是在极小值点附近，通过对目标函数做二阶泰勒展开，得到极小点的下一个估计值。  

设$$x_k$$为当前的极小点估计值，则$$x_k$$附近的二阶泰勒展开式就是:  
$$\varphi (x) = f(x_k) + {f}'(x_k)(x - x_k) + \frac{1}{2}{f}''(x_k)(x - x_k)^2$$

若该点为极值点，则应满足的条件是$$\varphi ' (x) = 0$$,即:  
$$f'(x_k) + f''(x_k)(x - x_k) = 0$$

可求得  
$$x = x_k - \frac{f'(x_k)}{f''(x_k)}$$

如果给定初始值$$x_0$$，则可构造出如下的迭代公式:

$$x_{k+1} = x_k + \frac{f'(x_k)}{f''(x_k)}, k = 0, 1, ...$$

以此$$x_k$$进行迭代，在一定条件下可以使$$f(x)$$收敛到极小值

经典牛顿法对于目标函数是二次函数或者类似二次函数的情况，处理效率较好，但是如果样本数据复杂，目标函数与二次函数相差较大，则无法进行处理。  

对此提出了拟牛顿法，在“拟牛顿”条件下优化目标函数。具体原理由于本章未详述，不再记录。

#####BFGS算法
拟牛顿法的实现

#####L-BFGS算法
只存储计算过程中的向量序列，防止因中间矩阵过大降低计算效率

#####代码实现
LBFGS.optimize -> LBFGS.runLBFGS -> BreezeLBFGS.iterations -> CachedDiffFunction -> LBFGS.CostFun
