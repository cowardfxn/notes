Title: Spark notes


#Spark Streaming
适用于流式计算，与Storm功能类似，但是集成于Spark，资源分配、调度等都依赖于**Spark的组件**，而Storm则是独立于Spark系统之外，是一套独立的系统。

*One Stack rule them all!!* Spark的一站式服务 :-D

##Streaming运行
数据流被读入Spark Streaming之后，被分割为许多小的数据块，然后用Streaming Engine处理。

##Dstream
 - 将流式计算分解成一系列确定并且较小的批处理作业(mini batch)
 - 将失败或执行较慢的任务(staggle)在其他节点上并行执行
 - 较强的容错能力(基于Lineage，Spark的RDD依赖机制，必要时重新计算RDD)

> DStream由一系列小段的RDD组成，对DStream执行的操作，实际上是在DStream上所有的RDD进行操作。

##数据源
 - Kafka
 - Flume
 - Twitter
 - ZeroMQ
 - MQTT
 - TCP sockets socket通信
 - Akka actor 包括Spark内部消息
 - HDFS 远程文件系统
 - 自定义 本地文件系统/FTP等等

##Streaming包下的transformation
 - 与Spark RDD语义一致
  * map, flatMap, filter, count, reduct, etc  
  groupByKey, reduceByKey, sortByKey, join, etc
 - 与Spark语义不同的部分
  1. 带状态的操作
   **updateStateByKey** 常用
  2. window操作 滑动取样窗口，对DStream中的RDD进行滑动取样  
  window, countByWindow, reduceByWindow, countByValueandWindow, reduceByKeyandWindow

##DStream输出
 - print
 - foreachRDD
 - saveAsObjectFiles, saveAsTextFiles, saveAsHadoopFiles

##持久化
 - 仍然允许调用persist持久化
 - 持久化的默认级别为<内存+序列化>
 - 对window和stateful的操作默认持久化(可能耗费很多内存)
 - 对于网络数据源，数据默认存储级别是StorageLevel.MEMORY_AND_DISK_SER_2

##checkpoint(将数据备份在hdfs上)
 - window和stateful操作必须checkpoint
 - 通过StreamingContext的checkpoint来指定目录
 - 通过DStream的checkpoint指定间隔时间
 - 间隔必须是slide interval(样窗口的大小)的倍数

##容错
 - Spark容错 基于lineage恢复(RDD，确定的不可变分布式数据集)
 - RDD的某些partition丢失了，也可以通过lineage恢复
 - DStreram的数据存储在一系列小RDD中，lineage恢复数据同样适用

对于可能出现的运行错误，Spark Streaming提供了不同的应对方案
###Wrker节点失败
两种情况
 1. 数据源来自外部文件系统，如HDFS  
 可以重新恢复，通过lineage重新读取数据等
 2. 数据源是网络  
 默认会在两个不同的节点加载数据到内存，一个节点fail了，还可以读取另外一个节点的数据  
 但是如果正在运行input receiver的节点fail了，已读取但没来得及存放到系统中的数据可能会丢失

###Driver节点失败
 - 系统会定期将元数据写到指定的checkpoint目录
 - Driver失败后可以通过checkpoint重启Driver  
 `val context = SparkStreaming.getOrCrete(checkpointDriverEntry, functionToCreateContext)`
 - Spark 0.9.0开始已经提供自动重启功能  
 如果代码重新编译过，必须生成新的context，而且代码内使用的StreamingContext的新建方式是getOrCreate,那么每次编译后必须清空Driver节点上的checkpoint目录，防止读取旧的缓存数据。

##Spark Streaming优化
除了与Spark相同的部分，还有一些Streaming独有的方面
###减少任务启动开销
 - 使任务更小(减少序列化开销)
 - 在Standalone和coarse-grained模式下的任务启动比fine-grained快

###选择合适的batch size
 - 没有统一的标准，视系统反馈的数据状况而定
 - 原则：要来得及消化流入系统的数据
 - 可以从Log4j或StreamingListener获取反馈

###内存限制
 - Streaming 默认是序列化后存入内存的
 - 清理缓存RDD(LRU 清理最近不使用的RDD)
 - 在spark.cleaner.ttl(设定保留数据的时间)之前缓存的RDD都会被清除
 - 设置spark.streaming.unpersist, 设置为true，由系统管理gc，确定哪些RDD不需要持久化，自动释放
 - CMS 暂停时间短，但是吞吐率不高，会引起内存碎片
 - 通过设置JVM的参数 -XX:CMSFullGCsBeforeCompaction 执行设定次数后开始CMS回收