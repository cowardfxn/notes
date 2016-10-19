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

![全部函数调用](file:///.img/runJob.jpg)

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

