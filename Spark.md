# Spark
---
##理论
RDD是Spark的核心，也是整个Spark的架构基础。它的特性可以总结如下：  

 * 基于Hadoop的存储系统  
 * 可以从本地文件系统、hdfs、ftp及http等多种数据源读取数据
 * 自身的操作和实现全部在内存完成，不涉及数据存储，即使是通过cache()实现的持久化（Persist）
 * 基本的数据结构是RDD(Resilident Distributed Datasets)，可以分布在不同的物理机上。


引用[Infoq]：
[Infoq]:http://www.infoq.com/cn/articles/spark-core-rdd
> RDD，全称为Resilient Distributed Datasets，是一个容错的、并行的数据结构，可以让用户显式地将数据存储到磁盘和内存中，并能控制数据的分区。同时，RDD还提供了一组丰富的操作来操作这些数据。在这些操作中，诸如map、flatMap、filter等转换操作实现了monad模式，很好地契合了Scala的集合操作。除此之外，RDD还提供了诸如join、groupBy、reduceByKey等更为方便的操作（注意，reduceByKey是action，而非transformation），以支持常见的数据运算。

> 通常来讲，针对数据处理有几种常见模型，包括：Iterative Algorithms，Relational Queries，MapReduce，Stream Processing。例如Hadoop MapReduce采用了MapReduces模型，Storm则采用了Stream Processing模型。RDD混合了这四种模型，使得Spark可以应用于各种大数据处理场景。

> RDD作为数据结构，本质上是一个只读的分区记录集合。一个RDD可以包含多个分区，每个分区就是一个dataset片段。RDD可以**相互依赖**。
> 如果RDD的每个分区最多只能被一个Child RDD的**一个**分区使用，则称之为narrow dependency；若**多个**Child RDD分区都可以依赖，则称之为wide dependency。  
> 不同的操作依据其特性，可能会产生不同的依赖。例如map操作会产生narrow dependency，而join操作则产生wide dependency。

>Spark之所以将依赖分为**narrow**与**wide**，基于两点原因。

>>首先，narrow dependencies可以支持在同一个cluster node上以管道形式执行多条命令，例如在执行了map后，紧接着执行filter。相反，wide dependencies需要所有的父分区都是可用的，可能还需要调用类似MapReduce之类的操作进行跨节点传递。

>>其次，则是从失败恢复的角度考虑。narrow dependencies的失败恢复更有效，因为它只需要重新计算丢失的parent partition即可，而且可以并行地在不同节点进行重计算。而wide dependencies牵涉到RDD各级的多个Parent Partitions。下图说明了narrow dependencies与wide dependencies之间的区别：

>>![narrow/wide dependencies](http://cdn1.infoqstatic.com/statics_s1_20160816-0334/resource/articles/spark-core-rdd/zh/resources/1rdd_stage.jpg)

>>>本图来自Matei Zaharia撰写的论文An Architecture for Fast and General Data Processing on Large Clusters。图中，一个box代表一个RDD，一个带阴影的矩形框代表一个partition。

>####RDD如何保障数据处理效率？

>RDD提供了两方面的特性*persistence*和*patitioning*，用户可以通过**persist**与**patitionBy**函数来控制RDD的这两个方面。RDD的分区特性与并行计算能力(RDD定义了parallerize函数)，使得Spark可以更好地利用可伸缩的硬件资源。若将分区与持久化二者结合起来，就能更加高效地处理海量数据。例如：
>
>```
>input.map(parseArticle _).partitionBy(partitioner).cache()
>```
>
>partitionBy函数需要接受一个Partitioner对象，如：
>
>```
>val partitioner = new HashPartitioner(sc.defaultParallelism)
>```
>
>RDD本质上是一个*内存数据集*，在访问RDD时，指针只会指向与操作相关的部分。例如存在一个面向列的数据结构，其中一个实现为Int的数组，另一个实现为Float的数组。如果只需要访问Int字段，RDD的指针可以只访问Int数组，避免了对整个数据结构的扫描。

>RDD将操作分为两类：transformation与action。无论执行了多少次transformation操作，RDD都**不会**真正执行运算，只有当**action**操作被执行时，运算才会触发。而在RDD的内部实现机制中，底层接口则是基于*迭代器*的，从而使得数据访问变得更高效，也避免了大量中间结果对内存的消耗。

>在实现时，RDD针对transformation操作，都提供了对应的继承自RDD的类型，例如map操作会返回MappedRDD，而flatMap则返回FlatMappedRDD。当我们执行map或flatMap操作时，不过是将当前RDD对象传递给对应的RDD对象而已。例如：

>
>```
>def map[U: ClassTag](f: T => U): RDD[U] = new MappedRDD(this, sc.clean(f))
>```
>
>这些继承自RDD的类都定义了*compute*函数。该函数会在action操作被调用时触发，在函数内部是通过迭代器进行对应的转换操作：
>
>```
>private[spark]
>class MappedRDD[U: ClassTag, T: ClassTag](prev: RDD[T], f: T => U)
  extends RDD[U](prev) {

>  override def getPartitions: Array[Partition] = firstParent[T].partitions

>  override def compute(split: Partition, context: TaskContext) =
    firstParent[T].iterator(split, context).map(f)
}
>```
>
>####RDD对容错的支持

>支持容错通常采用两种方式：*数据复制*或*日志记录*。对于以数据为中心的系统而言，这两种方式都非常昂贵，因为它需要跨集群网络拷贝大量数据，毕竟带宽的数据远远低于内存。

>RDD**天生是支持容错**的。  
 1. 首先，它自身是一个不变的(immutable)数据集。
 2. 其次，它能够记住构建它的操作图（Graph of Operation），因此当执行任务的Worker失败时，完全可以通过操作图获得之前执行的操作，进行*重新计算*。由于无需采用replication方式支持容错，很好地降低了跨网络的数据传输成本。

> 不过，在某些场景下，Spark也需要利用记录日志的方式来支持容错。例如，在Spark Streaming中，针对数据进行update操作，或者调用Streaming提供的window操作时，就需要恢复执行过程的中间状态。此时，需要通过Spark提供的checkpoint机制，以支持操作能够从checkpoint得到恢复。

>针对RDD的wide dependency，最有效的容错方式同样还是采用checkpoint机制。不过，似乎Spark的最新版本仍然没有引入auto checkpointing机制。

>**总结**

>RDD是Spark的核心，也是整个Spark的架构基础。它的特性可以总结如下：

> * 它是不变的数据结构存储  
> * 它是支持跨集群的分布式数据结构  
> * 可以根据数据记录的key对结构进行分区  
> * 提供了粗粒度的操作，且这些操作都支持分区  
> * 它将数据存储在内存中，从而提供了低延迟性

##Spark结构
![引自相同文章](http://cdn1.infoqstatic.com/statics_s2_20160816-0334/resource/articles/spark-core-rdd/zh/resources/1spark_architecture.jpg)

---

##Spark 读取文件
Spark支持读取本地文件系统，hdfs、http、https、ftp等源的文件。读取文件的方法相同，但是对于文件路径，不同协议有不同的实装方式。

* 对于本地文件，路径需要视Spark实例的运行路径而定：  
 1. 如果启动Spark时，设置的master是local，那么可以直接使用"file:///home/usr/doc/a.html"这样的路径读取本地文件。
 2. 如果启动时设置master为yarn，那么使用"file://path..."读取的文件会是被分配到运行任务的节点上本地的文件，而非启动任务的节点上，这点需要注意，不同节点上未必会有相同的路径和文件。
* 对于其他的远程文件，可以通过指定协议和路径读取：
 - hdfs文件路径类似"hdfs://192.168.0.101:8020/user/data/a.bin"，这里的hdfs文件系统端口是datanode，而非namenode
 - http、ftp这些路径应该类似，目前没有验证过

###读写文件的方法
* sequenceFile
 - sc.sequenceFile 读取顺序文件，读取键值对文件，对于Python对象，会使用PickleSerializer进行反序列化。
 - RDD.saveAsSequenceFile 将一个键值对RDD存储为顺序文件。
* textFile
 - sc.textFile 以文本类型读取文件，返回一个内容为字符串的RDD。
 - RDD.saveAsTextFile 将RDD以字符串形式存储为一个文件，对于对象应该只会调用默认的__str__方法。
* pickleFile
 - sc.pickleFile 读取一个之前使用RDD.saveAsPickleFile存储的文件，没有反序列化方法
 - RDD.saveAsPickleFile 将一个python对象存储为文件，使用的序列化方法是pyspark.serializers.PickleSerializer，分片数是10
* 还有一些读写Hadoop对象的方法，需要制定序列化/反序列化使用的java类，目前没有用到。

##关于Akka,Netty和Jetty
 * Spark使用**Akka Actor**(*ActorSystem*)进行远程协议调用(RPC)和发布消息  
 * 如果需要传输大量数据，可使用**Netty**  
 * 本地移动数据(shuffle data)默认设置是使用**NIO**，也可使用**Netty**  
 * 默认设置使用**Jetty**向所有节点广播数据  


##streaming

##视频笔记
Hadoop速度比Spark慢主要是因为使用磁盘存储数据，进行MR等操作时需要对磁盘进行频繁IO。

DAG 有向无环图，Spark对于RDD依赖关系的抽象  
窄依赖 每个RDD只会被一个RDD使用，map、filter、union等事件  
宽依赖 每个RDD被多个RDD使用，groupByKey、join with input not co-partitioned  
宽依赖与窄依赖的区分主要用于划分计算过程，进行负载均衡的设计等等。（生成DAG图的过程中）

###Spark的conf文件中的环境变量
```
export JAVA_HOME=
export SPARK_MASTER_IP = 
export SPARK_WORKER_CORES = 
export SPARK_WORKER_INSTANCES = 
export SPARK_WORKER_MEMORY = 
SPARK_JAVA_OPTS  # deprecated
```

MASTER设置
MASTER=local[本地线程数]
MASTER=spark://host:port

读取本地文件系统的文件：
path = 'file:///home/user/lib/data.bin'

###reduceByKey与reduce的区别
 - reduceByKey 只能用于(k, v)形式数据的RDD，在groupByKey的基础上，再次对相同key的数据进行指定操作，返回值value的类型则由具体的操作指定
 - reduce 可用于各种RDD，基本过程是使用RDD中前两个元素作为参数执行指定的操作，在将返回结果和下一个RDD元素传入指定函数，依次循环，最后得到的只有一个结果。需要注意的是指定函数的返回结果要能够作为参数执行被指定的函数，否则循环会执行一次之后就中断


`Stage` 一个Job会被拆分为多组任务，一组任务称为一个stage。通常是需要shuffle时结束一个Stage

每个partition都会被分配一个task

不要移动数据，而去移动计算。任务最好运行在数据所在的节点上。

####任务调度流程
 1. RDD objects 生成DAG图
 2. DAGScheduler 将DAG图拆分成多个任务组成的stage，以stage为单位向TaskScheduler提交任务
 3. TaskScheduler 通过Cluster Manager运行任务，当任务失败时重启任务或者中止任务序列，返回DAGScheduler
 4. Worker 接收任务并执行，缓存运行数据

###RDD 源码层面分析
####RDD的特性
 1. 分区 `protected def getPartitions: Array[Partition]`
 2. 依赖 `pretected def getDependencies: Seq[Dependency[_]] = deps`
 3. 函数 `def compute(split: Partition, context: TaskContext): Iterator[T]`
 4. 最佳位置(可选) `protected def getPreferredLocations(split: Partition): Seq[String] = Nil`
 5. 分区策略(可选) `@transient val partitioner: Option[Partitioner] = None`

不同种类的RDD，这五个特性不同。

RDD类型 | 分区  | 依赖 | 函数 | 最佳位置 | 分区策略
-------|-------|-----| ----- | ---------- | -----------
HadoopRDD | 每个HDFS block | 无 | 读取每一个block | HDFS block所在位置 | 无
FilteredRDD | 与父RDD一致 | 与父RDD一对一 | 计算父RDD的每个分区并过滤 | 无(与父RDD一致) | 无
JoinedRDD | 每个reduce任务一个分区 | 所有父RDD | 读取shuffle数据并计算 | 无 | HaspPartitioner(partitions: Int)

###DAG Scheduler
 - 基于Stage构建DAG，决定每个任务的最佳位置(以stage当前状态而言的最佳)
 - 记录哪个RDD或者Stage输出被物化(materialize)
 - 将taskset传给底层调度器TaskScheduler
 - 决定运行任务的最优位置
 - shuffle会打乱原有的RDD依赖图，因此stage会在shuffle前后生成
  * 最终，各个stage之间只会存在shuffle关系，而非原来的RDD依赖关系
 - 当shuffle失败后，重新提交Shuffle输出丢失的stage

*shuffle之前会将目标RDD的数据持久化，以备错误恢复。*

####调度器优化
 - 一个Stage内的窄依赖会被pipeline到一个任务组(taskSet)中
  * 实际的pipeline操作会在各种RDD(MappedRDD、FilteredRDD)的RDD.compute()方法中执行
 - 基于partition选择最优的join算法，使得shuffle的数据最小化
 - 重用已缓存过的数据

####关于Stage
具有相同shuffle依赖的任务会被划分到同一个任务组，不同任务组又根据shuffle边界被拆分为Stages，DAGScheduler会安装拓扑顺序(有向无环图，DAG)提交这些Stages。

####代码锚点
jobIdToStageIds 当前job下需要执行的stage的id  
stageIdToStage stageId到stage对象的映射  
shuffleToMapStage shuffle dependency id到stage对象的映射  
jobIdToActiveJob 已被提交的job id到对象的映射  
cacheLocs RDD的id到所在partitions号码的映射  

###Task 细节
 - Stage边界只出现在外部输入及取shuffle数据的时候
 - 会把shuffle输出写在内存或磁盘上，以备出错
 - 任何一个任务可以运行在任何一个节点上
 - 允许任务使用曾被缓存但已经被置换出去的数据(重新计算或重新读取)

####TaskScheduler
 - 提交taskset（一组task）到集群运行并汇报结果
 - 出现shuffle输出丢失的情况时，会报告fetch failed错误
 - 遇到straggle任务(长时间执行但没有返回的任务)，会在其他节点上重试该任务，收到任何一个相同任务的返回时，即认为任务结束
 - 为每个TaskSet维护一个TaskSetManager(追踪本地信息及错误信息)

###广播变量
 - BT形式的广播变量
 - 使用场景：lookup表、map side join(类似外连接)
 - 注意：只读，存于每台worker的cache，不随task发送
 - 使用方式：
```
val broadcastVar = sc.broadcast(Array(123))  
broatcastVar.value
```

###累加器
**Accumulator**
 - 只增，类似pyspark中的add
 - 类似MapReduce中的counter
 - 用法：
 ```
 val accum = sc.accumulator(0)
 sc.parallelize(Array(1, 2, 3, 4)).foreach(x => accum += x)
 accum.value
 ```

###性能调优示例

 - 有些公用数据、外部连接等，不需要每个元素取一次时，可以用mapPartitions替换map，减少取得公共资源的次数和因此产生的性能问题

 - 如果操作中可能有大量或者频繁的shuffle操作，可以设置spark.local.dir作为shuffle目录

 - 太多的reducer会造成很多的小任务，产生太多启动任务的开销。  
而reducer太少则会使单个任务过大，拖慢执行速度

 - 如果collect输出大量结果速度缓慢，可以考虑将结果直接存储在分布式文件系统中(在单个任务中进行？)  
collect会集中所有任务的返回结果，将它们放进一个新的数组中返回

 - 对于序列化，Spark默认使用JDK自带的ObjectOutputStream，体积大速度慢，兼容性好。  
Alternative是使用Kryo serialization，体积小速度快，但是需要注册自己的类


###Spark as a service
通过RESTful接口提供job和context管理  
启动服务时，预启动context，支持低延时任务  
API有同步和异步两种，同步API用于运行较快的任务，可以即时返回结果。异步API用于耗时超过HTTP请求响应时间的任务，便于HTTP服务响应。  
典型实现：***JobServer***  
####JobServer
开发模式启动，需要sbt  
`re-start /path/to/my.conf --- -Xmx8g`

#####上传Jar
`curl --data-binary @job-server-tests/target/job-server-tests-0.3.1/jar localhost:8090/jar/test`  
8090为jobServer默认端口  
`GET /jars` 查看jar  
`POST /jars/<appName> - 上传jar到<appName>

#####提交job
`curl -d "input.string=a b c d a e f a" 'localhost:8090/jobs?appName=test&classPath=spark.jobserver.wordCoundExample'`  
返回结果为任务状态的JSON字符串

#####查询job
`curl localhost:8090/jobs/c48d4778-7137-4cfa-ac47-345345erwtc`  
返回结果为任务状态和执行结果(如果任务结束)

#####job相关API
`GET /jobs` 查询所有job  
`POST /jobs` 提交一个新job  
`GET /jobs/<jobid>` 查询某一任务的结果与状态  
`GET /jobs/<jobid>/config` 查询某一任务的配置  

#####作为服务的context
######预先建立context
`curl -d "" 'localhost:8090/contexts/test-context?num-cpu-cores=4&mem-per-node=512m'`  
`curl localhost:8090/contexts`

######在指定context上运行任务
`curl -d "input.string=a b c d a e f a" 'localhost:8090/jobs?appName=test&classPath=spark.jobserver.wordCoundExample&context=test-context&sync=true'`

######context相关API
`GET /contexts` 查询所有预先建立的context  
`POST /contexts/<name>` 建立新的context  
`DELETE /contexts/<name>` 删除context，并停止所有运行在该context上的job

######配置方式
写在conf文件中， context-settings字段定义各个属性  
以参数形式写在url中，参照上面建立context的url

#####部署
暂未涉及

###Spark on YARN
从结构上说，YARN位于HDFS与SPARK之间。  

![SparkOnYARN结构图](file:///.img/sparkonyarn.png)

####YARN组件
 - ResourceManager
 - ApplicationMaster
 - NodeManager
 - Container

每个SparkContext有一个ApplicationMaster
每个Executor对应一个Container

###yarn-cluster与yarn-client

 部署方式 | 类名 | 执行过程
-----| ----- | ------
yarn-cluster | YarnClusterScheduler | Client和Driver运行在一起，AM(ApplicationMaster)只用于获取资源
yarn-client | YarnClientClusterSchduler | Driver和AM运行在一起，Client可以在远程位置


###环境变量配置
 - SPARK\_YARN\_USER\_ENV 传给spark进程的环境变量
 - export SPARK\_JAR=hdfs://some/path 外部文件的位置
 - HADOOP\_CONF\_DIR/YARN\_CONF\_DIR 执行Hadoop配置文件所在目录

**yarn.nodemanager.local-dirs** YARN的本地目录位置  
查看container的launch脚本 -- launch_container.sh  


##Tachyon
使用thrift实现  
在不同的Spark job之间共享数据存储

 - 单个job内，由于lineage的存在，个别RDD的数据损坏不会影响任务整体
 - Tachyon的存在，让某个job崩溃之后，数据仍不会丢失

*Recall：lineage的实现基于DAG(有向无环图)*

