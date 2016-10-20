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

Metrics子系统的配置文件在$SPARK_HOME/conf/metrics.properties，默认的Sink是MetricsServlet。  
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
![数据写入内存过程](file:///./img/memoryCache.jpg)

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


####启动Master
 1. 配置信息读取，MasterArguments
 2. 创建Actor


MasterArguments读取的环境变量包括：

 - spark\_master\_host 监听地址
 - spark\_master\_port 监听端口
 - spark\_master\_webui\_port webui监听端口

####启动Worker
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

####运行spark-shell

