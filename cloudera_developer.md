####Common Hadoop Use Cases
 - *ETL* Extract, Transform, and Load
 - Collaborative Filtering  协同过滤
 - Prediction models
 - Sentiment analysis  监控日志分析
 - Graph creation and analysis
 - Risk assessment
 - Pattern recogination  模式识别

#####窗口函数
Impala没有窗口函数，Hive有窗口函数

```
select ... from ... over (select ...  # sliding window)
```


impala-shell  
hive/beeline  
两者都支持使用SQL语句查询


 - `hdfs dfs -put /dir_or_file_path /hdfs_path`  上传文件到hdfs目录
 - `hdfs dfs -rm -r /hdfs_path` 删除hdfs上的目录或文件
 - `hdfs dfs -get /hdfs_path /local_path` 从hdfs上下载文件到本地
 - `hdfs dfs -tail /hdfs_path` 查看hdfs文件内容，没有`hdfs dfs -head ...`这样的命令


`localhost:8888` hue的WebUI的默认地址和端口，类似Spark的WebUI，通过hue的web界面也可以查看hdfs文件和提交的YARN任务的运行情况

`localhost:8088` hadoop的WebUI的默认地址和端口，可以查看提交到集群的任务的运行状况

`localhost:4040` Spark application UI的默认地址和端口，可以查看Spark上任务的运行情况，包括事件的时间线和DAG可视化(查看各个stage)

YARN不会保存任务的历史运行记录，  
但是是Spark和MapReduce则各带有一个历史记录服务端，保存任务的运行情况和元数据，也可以通过该服务端或者Hue访问运行的历史记录

#####常用命令
 - `yarn application -list` 列出正在运行的任务
 - `yarn application -kill application_id` 停止正在运行的任务
 - `yarn logs -applicationId <app-id>` 查看任务的log


####sqoop
一个命令行的工具，运行在MR的基础上  
可以用于在RDBMS与HDFS之间交换数据，支持双向导入导出  
对于RDBMS，sqoop是基于jdbc的  

#####一次sqoop import的三个步骤
 1. 解析目标表结构，检查表的主键、索引、数据库类型等
 2. 创建任务，提交到集群
 3. 从表中取出数据，写入HDFS(底层是MR)

sqoop是一系列命令行工具的集合，可以使用`sqoop help`查看可用的工具，然后使用`sqoop help 工具名`查询某个特定工具的使用方法  
sqoop连接RDBMS时必须提供--table、--connect jdbc...、--username、--password等连接数据库的信息才能使用

实际使用时，select语句最好配合LIMIT使用，限制返回的数据量。--password不允许为空，sqoop会无法解析用户名和密码，这点与mysql的用户限制不同。

```
sqoop eval --query "SELECT * FROM my_table LIMIT 5" --connect jdbc:mysql://localhost/loudacre --username dbuser --password pw
```

#####导入与导出
 - `sqoop import` 从RDBMS导入数据到HDFS，可以全表导入也可以指定单个表，或指定查询条件。导入HDFS的默认文件格式是纯文本格式，可以直接查看内容，也可以使用`--as-parquetfile`指定存储文件的类型是parquet文件，这时可以通过parquet-tools查看`parquet-tools head hdfs://hdfs_full_path`；或使用`--as-avrodatafile`指定avro格式存储；也可以指定压缩数据
 
 ```
 sqoop import --connect jdbc:mysql://localhost/loudacre --username dbuser --password pw --table accounts --target-dir /loudacre/accounts_parquet --as-parquetfile --fileds-terminated-by "\t" --compression-codec org.apache.hadoop.io.compress.SnappyCodec
 ```
 
 - `sqoop export` 从HDFS导出数据到RDBMS，可以指定`--update-mode allowinsert`，设置upsert
 
 ```
 sqoop export --connect jdbc:mysql://localhost/lodacre --username dbuser --password pw --export-dir /loudacre/recommender_output --update-mode allowinsert --table product_recommendation
 ```

**hive日期存储** ?


####关于RDD
RDD在创建之后就不能被改变，所有的transformation都是创建新的RDD  
创建RDD时，可以手动指定最小partition的个数  
也可以设置partition数的环境变量`spark.default.parallelism`  
默认情况下，RDD的partition数目和父RDD的相同  

#####RDD的partition
在cluster上运行时，默认的partition个数是两个  
使用单线程在本地运行时，默认的partition数目是一个  
Spark的并行执行以partition为单位，更多的分区可以带来更多的并行性能  
如果设置的partition数过少，也会影响集群的运行性能

操作partition的函数，传入的partition类型是iterator

rdd存储成文件时，每个block存放在一个节点上，在执行action读取数据时，从block读出数据到executor的partition中，供Spark调度

######不会重新分区的操作
map、flatMap、filter、union
######会导致RDD重新分区的操作
reduceByKey、sortByKey、join、groupByKey

*Lazy Execution*

Scala的匿名参数`_`  `mydata.map(_.toUpperCase()).take(10)`

`rd1.toDebugString()` 可以查看RDD的依赖关系

`rdd.zip` 这个方法左右两边的rdd必须长度相同，否则会报异常

pyspark中减少输出log：默认的log级别是INFO，可以设为WARN  `sc.setLogLevel('WARN')`

`rd1.keyBy(lambda line: line.split(" ")[2])` 直接提取key，返回key-value结构的新rdd

`rd1.flatMapValues(lambda value: value.split(","))` 展开合并后的value，返回每个key-value结构中只有一个value的新rdd


`rd1.countByKey` 可以直接实现wordcount，注意，这是个Action，相对的，reduceByKey是个Transformation

`rd6 = sc.textFile("/loudacre/weblogs/*3.log")` 读取文件时路径中可以使用通配符

`rd1.foreachPartition(lambda ...)` Action，以partition为单位进行操作

`rd1.join(rd2)` 会将主键相同的value合并到同一个集合中，但是结果一般是tuple，不会像groupByKey那样是内部数据类型

Spark UI只有在任务仍在运行时才能够看到运行情况

#####向Spark提交Scala程序
进入Scala程序目录，运行`mvn package`，打包后的jar文件会生成在target目录下  
提交命令:

 - `spark-submit --master yarn-client --class stubs.CountJPGs target/countjpgs-1.0.jar /loudacre/weblogs/*`
 - `spark-submit --properties-file property_file_path` 指定空格或Tab分隔的配置文件

spark中的日志级别从低到高共有七个：TRACE、DEBUG、INFO、WARN、ERROR、FATAL、OFF  
设置为OFF时，表示只保存节点本地运行记录，不保存集群记录

对比Spark的RDD执行时的stage和Hive语句运行时的stage(通过explain sql_str查看)

`sc.wholeTextFiles(dir_path)` 返回的rdd以文件路径为key，文件内容为value

####Stage
操作同一个partition的RDD操作运行在同一个stage中  
同一个stage中的任务(task)会被整合(pipelined)在一起  
调整stage可以影响Spark任务的运行性能

#####Spark术语
 - *Task* 发送给一个executor的work的基本单位
 - *Job* action发起执行的一组Task
 - *Stage* Job中可以被并行执行的一组Task的统称
 - *Application* 一个driver节点上运行的Job的集合

####宽依赖与窄依赖
 - 窄依赖可以被合并在一个stage中执行，**map、filter、union**这些操作产生的RDD都是窄依赖于父RDD的
 - 宽依赖会产生一个新的stage，产生宽依赖的过程中会触发shuffle，造成重新分区，**reduceByKey、join、groupByKey**这些操作产生的RDD都是宽依赖于父RDD的
  * 产生宽依赖的操作也可以传入设定partition数的参数`rd1.reduceByKey(labmda a, b: a + b, 20)`


如果RDD被persist到内存中，那么当内存空间不够时，最早被缓存的RDD会被清除  
如果某个被缓存的RDD损坏了，Spark会根据Lineage在另一个节点上重新计算该partition(不会主动恢复原本缓存的RDD)  
RDD的可恢复特性来源于可以根据Lineage重新计算，Lineage的数据会被保存起来，保证数据不会丢失

`rd1.persist(storagelevel)` 可以指定保存到内存、硬盘、或者混合存储(优先使用内存，如果内存不足，使用硬盘空间)，并决定是否存储序列化后的数据

#####StorageLevels
 - `MEMORY_ONLY`
 - `MEMORY_AND_DISK`
 - `DISK_ONLY`
 - `MEMORY_ONLY_SER`  使用序列化
 - `MEMORY_AND_DISK_SER`
 - `DISK_ONLY_2` 将单个分区存储在两个节点上，replication
 - `MEMORY_AND_DISK_2`
 - `MEMORY_ONLY_2`
 - `MEMORY_AND_DISK_SER_2`
 - `MEMORY_ONLY_SER_2`

`rd1.cache()` 作用类似persist，但是没有参数

`rd1.unpersist()`  删除缓存，如果需要修改RDD的缓存级别，也需要先删除缓存，在重新persist

RDD的lineage如果太长，重新计算成本会很高，而且可能造成内存溢出

checkpoint可以将数据保存在HDFS上，跨节点也可以使用，但是checkpoint不会保存lineage

使用checkpoint之前，必须指定checkpoint使用的目录

```
sc.setCheckpointDir(dir_path)
...
rd1.checkpoint()

```

####常用计算

 - collaborative filtering 协同过滤
 - Clustering 聚类
 - Classification 分类

ALS Alternating least squares


####Spark SQL
SQL context是基于SparkContext的，HiveContext是从hive读取数据需要使用的，相比SQL context，cloudera推荐的是HiveContext


DataFrame是Spark SQL的主要抽象模型  
DataFrame可以使用*map、flatMap、foreach*等方法转换为RDD

`hql.read`方法返回一个`DataFrameReader`对象，可以用于从json、parquet或者jdbc等数据源向Spark中读取数据  
相对的，`hql.write`方法返回`DataFrameReader`对象，可以将Spark应用中的数据写入各种数据源

 - jdbc 写入jdbc连接的SQL数据库
 - json 写入json文件
 - parquet 写入parquet文件
 - orc 写入ORC文件
 - text 写入纯文本文件
 - saveAsTable 写入Hive/Impala的表，只有HiveContext可以，SQL context无法写入

SparkSQL主要的应用场景是Spark的application从ETL中读取数据

parquet-tools使用  
`parquet-tools schema hdfs://localhost/loudacre/webpage_files` 查看sqlContext.write保存的表数据的schema  
`parquet-tools head hdfs://localhost/loudacre/webpage_files` 查看parquet文件数据

####Kafka
Kafka自身没有从数据源采集数据的接口

####Flume
Flume可以通过配置实现常用的应用场景，而不需要写代码。

使用kafka作为flume的source和channel，可以利用kafka的多个broker设置，实现分布式采集或存储的功能

####Streaming
使用`ssc.checkpoint(dir_path)`来防止RDD的linage随时间累积

`updateStateByKey` 根据当前的batch更新前面的DStream的状态(累加、平均、集合append等)

#####window操作
在ssc设定了刷新周期后，window函数里还需要设置窗口的周期，一般是ssc更新周期的整数倍

`reduceByKeyAndWindow`  窗口操作  
`DStream.window(windowDuration, slideDuration=None)` 基本的window方法

