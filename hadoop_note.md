#Hadoop note

#####Points

 * Hadoop Configuration and deamon logs
 * Managing Resources

#####sqoop 
batch工具，支持批量操作  
可以将关系型db导入hdfs

#####常用业务分类

 - **BATCH** Spark, Hive, Pig, MR
 - **Streaming** SparkStreaming
 - **SQL** Impla 兼容传统SQL语句
 - **Search** Solr(知识库检索)

######EDH
企业级的Hadoop应用，提供收费服务。
 
######免费部件

 - 支持配置回滚
 - 滚动升级
 - LDAP 集中的用户组管理
 - 自动恢复

######收费部件

 - 安全管理部分

数据处理速度虽然很快，但是读取速度却很慢

使用分布式系统而非一味追求更快的计算机

> In pioneer days they used oxen for heavy pulling, and when one ox couldn't burge a log, we didn't try to grow larger ox. We shouldn't be trying for bigger computers, but for more systems of computers.
>     -- Grace Hooper

#####分布式系统的缺点

 - 分布式系统增加了系统的复杂性
  * 可用性
  * 数据一致性
  * 事件同步
  * 带宽限制
  * 局部失败
  * 整体系统异常
- 这些限制通常比需要使用分布式系统处理的问题本身更复杂
 * 异常处理占据了很大一部分的代码

#####分布式系统的前提

 - Failure is inevitable. 异常的出现不可避免，但应该尽量处理掉。
 - 理想的分布式系统应该有以下特点
  * **Automatic** 不需要人为干涉，任务可以自动完成
  * **Transparent** 被分配给故障节点的任务可以被其他节点执行
  * **Graceful** 任务失败对系统负载能力造成的影响与其负载成比例，而不会无限扩展
  * **Recoverable** 节点功能恢复后，可以被重新加入系统
  * **Consistent** 任务失败不会影响整个系统或者输出无效的结果
 - 性能可以线性提升  
增加Hadoop节点可以保证性能线性提升，而不会出现增加节点整体系统性能不变甚至下降的情况，如Oracel集群、MySQL集群
 - 任务在相对独立的环境下运行
  * 任务的结果不会影响其他的任务
 - 编程模型简单，便于开发
  * MapReduce programming  
Deal with one record(key-value pair) at a time  
编程的核心是如何将数据组织成k-v对

**MTBF** mean time between failures

#####Core Hadoop Hadoop核心组件

 1. HDFS
 2. YARN
  - 应用调度和资源管理
  - MapReduce v2 用于数据处理

 3. 运行环境组件
 
  - 文件访问工具 hdsf命令行工具
  - 应用调度和监控 YARN的访问方式
  - Web UI

#####核心以外的组件

 - **Spark** 进行数据处理
 - **ZooKeeper** 任务协调
 - **Mahout** Hadoop的ML工具库  
 - **Hue** 集成的组件管理，优化用户使用，有供使用的web界面  
 - **oozie** 任务流定制  
 - **Cloudera Director, Clourdera Manager** 集群管理

####Hadoop安装

######Cloudera Manager
 1. 需要消耗额外的资源，最好单独部署在一个节点上  
 2. 需要部署一个关系型数据库供CM自身使用  
 3. CM提供了大量API，可以用于二次开发  
 4. 默认端口7180  
 5. CDH Software Repository

#####部署流程

 1. 安装关系型数据库
 2. 下载Clourdera相关的安装文件源。CM和CDH是分开发布的，需要注意
 3. 安装Cloudera Manager和agent(会自动安装)
 4. 为所有节点安装CDH服务和RPM程序包

限定是64位操作系统  
安装时会创建新的用户和用户组，以及启动脚本

#####CM发布文件的类型

 - rpm(redhat package manager) yum源
 - parcels 

[CDH/CM官方下载路径](http://archive.cloudera.com/cdh5/parcels/5.10/)  
需要下载parcels文件、校验码.sha1文件，以及manifest.json文件

#####守护进程在节点上的分布

 - HA 高可用 一个集群一个 NameNode, ResourceManager, JobHistroyServer, HDFS Balancer
 - 非HA 非高可用 一个节点上一个 DataNode

daemon Cloudera Manager程序

mysql安全加固  
禁用不安全的MySQL访问设置  
`sudo /usr/bin/mysql_secure_installation`

更新包管理器的源之后，在线安装Cloudera Manager

#####安装CDH

####HDFS

 - 基于Google的GFS
 - 在本地文件系统(ext3, ext4等)的基础上实现
 - 提供数据冗余机制 默认备份数量是3
 - 数据会被分配到所有节点上，提供高效的并行化数据读取机制

#####HDFS的优点
 - 高性能，高容错性
 - 相对简单的集中管理方式
  * Master-worker结构
 - 经过优化的数据处理过程
  * 优先使用本地数据块
 - 可扩展性好

hdfs上的目录可以设置读写权限，拥有者和所属组等权限  
但是hdfs不对用户做校验，所有可以访问HDFS文件的用户，拥有同样的权限

#####block

HDFS适用于存储大文件(128M以上，生产环境上单个文件1G以上)，不适用于小文件  
当文件被提交到HDFS上时，被切分为block存储，block的默认大小是128M
以block为单位进行读写，流式读取，无法直接写入，只能删除文件，重新提交

#####数据冗余备份
 - block的备份会存储在不同的节点上(视备份数目设定而定，默认是有两份冗余，一共三份相同的数据)
 - 备份也增加了系统稳定性和读取效率

#####HDFS without High Availability
非高可用性部署方式  
整个集群有三种节点：

 1. NameNode 在master节点上
 2. SecondaryNameNode 也在master节点上
 3. DataNode 在worker节点上

一旦NameNode出错中止运行，整个集群就会崩溃

#####NameNode
在内存中存储元数据，包括block的id、大小，所在节点等，是访问hdfs文件系统的入口节点

元数据存储在硬盘上的fsimage文件中，在集群启动时被加载到NameNode节点的内存中
元数据的变更会写入edit log

同一个block的备份也可以在负载均衡时被其他节点使用，做到最大程度上的本地化处理

#####Worker Nodes
实际存储数据的节点  
每个worker node上都会运行一个DataNode程序实例(DataNode daemon)，用于访问数据块和与NameNode交互  
block在worker node上以基础的文件形式存储，文件名类型blk_xxxxxx，但是在worker节点上，没有任何该文件从属关系的数据，这些都存储在NameNode上  
每个block都在不同的节点上有冗余备份  

#####SecondaryNameNode 

 - **并不是热备节点**
 - SecondaryNameNode的配置应和NameNode一致，而且部署在单独的节点上
 - SecondaryNameNode会每隔一段时间(默认每小时一次)将系统当前的文件系统的元数据(fsimage文件)和edit log的快照(snap shot)合并到之前的快照中，形成新的系统快照。这个流程叫做*checkpoint*
 - 只有在未配置高可用性时才会存在，在启用了高可用性设置时，SecondaryNameNode的工作--更新checkpoint--由集群中的备用NameNode完成

fs image不会再每次写入HDFS文件时都更新

SPOF Single Point of Failure，单点失效就集群崩溃，如非HA模式下的NameNode进程崩溃的情况

#####高可用方式部署HDFS HDFS with high availability
可以避免SPOF  
有两个NameNode，一主一备，主节点失效后，备用节点将接替工作。空闲的备用节点会执行checkpoint任务

#####HDFS缓存数据
HDFS可以设置数据缓存在内存中，当使用可以读取缓存的工具时(Impala等)，可以提高读取效率  
Cloudera Manager 默认允许HDFS数据缓存  
DataNode默认缓存数据的内存大小是4G，配置参数是dfs.datanode.max.locked.memory，可以按照role group单位设置，当被设置成0时，表示禁止缓存

#####HDFS文件写入流程

 1. 用户节点(client)通过HDFS接口连接到NameNode
 2. NameNode将文件数据的源数据写入自身的metadata数据集中，然后返回分割好的block名和DataNode列表给client
 3. client连接到第一个DataNode，开始写入数据
 4. 当第一个DataNode收到数据后，会自动向第二个DataNode发送数据
 5. 第二个DataNode会以同样的机制向第三个DataNode发送数据
 6. 文件读写使用的pipeline会在数据写好后，向client发送完成信号
 7. 收到完成信号后，client向NameNode发送完成写入的信号

其中，当DataNode上写入数据的pipeline发生异常时，该pipeline会被关闭，然后在另一个正常的节点上，重新启动pipeline，继续写入数据。而NameNode也会收到通知，重新在其他DataNode上备份数据。

数据写入结束后，client会计算每个block的checksum，并将计算结果发送给每个DataNode，写入block中，用来保证读取时数据的完整。

如果Hadoop检测到一个block的冗余数目没有达到设置的冗余数目限制，会自动将数据备份

#####Rack awareness
类似路由最优线路的概念，系统记录了各个block和其备份的分布位置，自动选择读取效率最高的节点  
该功能可以配置，ResourceManager上有节点所在的节点位置  
允许NameNode“就近”读取数据  
详细的选择节点读取数据的策略，需要用户自定义的脚本  

#####HDFS文件备份原则
 - 第一个副本放在client所在的节点
  * 如果client不是集群节点，那么会被随机存放在集群的一个负载较小的节点上
 - 第二个副本放在相邻rack的节点上
 - 第三个副本放在与第二个副本相同的rack的另一个节点上

#####HDFS文件读取流程

 1. 用户程序(client)连接到NameNode
 2. NameNode返回距离client节点最近的存储指定文件的block的DataNode列表
 3. client连接到DataNode，开始读取block。如果读取失败，client会自动按照上一步收到的DataNode列表，向下一个DataNode请求数据

client读取block时，会根据已经读取的数据生成新的checksum，与原有checksum对比，如果两种不同，那么client会向NameNode报告当前DataNode数据损坏，然后从下一个节点读取数据  
NameNode在收到DataNode上block损坏的通知后，会使用其他位置的数据备份重写该block  
DataNode会经常性的自检checksum，防止硬件损坏。默认的周期是从block被创建开始，每三周进行一次。

#####数据可靠性和数据恢复
DataNode每隔3秒会向NameNode发送一次心跳信号  
如果一段时间没有收到心跳信号，NameNode会认为DataNode已经失效，然后在其他节点上备份原来存储在该DataNode上的block  
DataNode可以在下线一段时间后重新加入集群，NameNode会检索整个集群，删除在该DataNode存在的block的多余备份

#####NameNode配置参数
对于集群的各种读、写，备份等操作而言，NameNode的配置一般不会是性能瓶颈所在。  
但是NameNode上的各种元数据，在集群运行是都是在内存中存放的，因此最好有足够大的内存供NameNode使用。  
NameNode默认的Java Heap Size 是至少1G，每一百万个block，推荐增加1G内存

NameNode上还存储着文件名、权限信息，各个block信息等数据。

由于数据冗余备份和分block存储的结构，HDFS适合存储数量较少，单个体积较大的文件

HDFS中的文件支持权限设置和数据加密，有各种加密级别可供选择。

#####操作HDFS文件
 - **命令行HDFS shell** hdfs dfs...
 - Cloudera Manager
 - NameNode Web UI 不同于CM的File Brower界面
 - 通过其他程序API操作

常用命令

 - `hdfs dfs -cat remote_file_path` 展示文件内容
 - `hdfs dfs -mkdir remote_dir_path` 创建远程目录
 - `hdfs dfs -put local_file_path remote_file_path` 上传本地文件
 - `hdfs dfs -get remote_file_path` 下载远程文件
 - `hdfs dfs -rm remote_file_path` 删除文件
 - `hdfs dfs -ls remote_file_path` 显示远程目录下的文件

####HBASE
基于Google的BigTable的论文  
可以在一张表中存取大量数据，同时拥有很好的读写性能  
HBASE的所有文件都存储在HDFS上，在HDFS的基础上，以NoSQL键值对的形式进行操作
提供了基于HDFS进行高速随机读写的解决方案  
数据会尽可能的就近读取

#####Apache Kudo
结合HDFS和HBASE的优点，读写效率更高，CPU和磁盘有更高的利用率


####YARN Yet Another Resoure Negotiator
管理Hadoop集群的平台，可以实现集群资源的高效应用  
YARN为MapReduce任务或者Spark等计算框架提供资源管理和底层支持功能  

YARN的单个容器中，只能执行单个Mapper或者Reducer

#####MapReduce
编程模型，不限定语言  
Map过程和Reduce过程之间，是shuffle and sort过程，与Spark的shuffle stage不同 

######MapReduce基本概念

 - 每个Mapper进程有一个从HDFS读取数据的输入split，通常对应HDFS的一个block
 - Hadoop每次想Mapper发送一行数据
 - 每行数据都是一个键值对
 - Mapper产生的中间数据被存放在本地磁盘上(性能瓶颈所在)
 - 在shuffle and sort阶段，所有具有相同key的中间数据都被发送到同一个Reducer，Reducer的个数由任务自行决定
 - Reducer收到的是key和一个包含所有value的列表，key是已经被排过序的
 - Reducer的输出会被写到HDFS

###### Job
Mapper, Reducer和一系列输入  
MapReducer过程中最高级别的单位

######Task
一个独立的任务，可以是Map task，也可以是Reduce task  
一个Job由一系列Task组成  
在YARN中，一个Task在Worker节点上的一个Container中运行

######Client
向YARN ResourceManager提交任务的程序，又是也指任务提交程序运行的机器

#####Spark
Spark提交方式

 - client mode driver在client上运行，如果提交任务的节点离线，整个任务都会失败
 - cluster mode driver在集群的某个节点上运行，不受任务提交节点的限制

可以与HDFS的HA/非HA模式对比

直到整个任务结束，Spark申请的executor才会被回收
spark.dynamicAllocation.enabled 设置成true时，可以动态申请Executor的大小

#####YARN进程
 - ResourceManager 每个集群只有一个，为worker node分配资源，对application进行初始化
  * 管理节点，接收NodeManager的心跳
  * 负责资源分配
  * 管理container，处理ApplicationMaster请求资源的申请；当container发生异常或者正常结束，释放container
  * 管理ApplciationMaster，创建一个运行ApplicationMaster的container，并监听心跳
  * 在集群层面进行安全管理
 - JobHistoryServer 每个集群一个，保存MapReduce或Spark任务的运行数据以及元数据
 - NodeManager 每个worker节点上都有一个，管理worker节点的资源，执行任务
  * 负责和ResourceManager进行通信，向ResourceManager注册NodeManager，提交各种状态信息和心跳
  * 管理container中的进程，启动ApplicationMaster进程或者ApplcationMaster发送的任务进程，监控container的资源使用情况，清楚异常进程
  * 提供application的日志聚合服务
  * 运行辅助服务
  * 负责节点层面的安全管理

######Container

 - 由ResourceManager申请创建
 - 需要使用worker节点上的部分硬件资源
 - YARN applications都是运行在一个或几个container里的

######ApplicationMaster
 - 每个YARN application都有一个
 - 运行在container中
 - 不同的框架或者应用，有不同的ApplicationMaster
 - 负责与ResourceManager通信，调度为执行application而向ResourceManager申请container的请求
 - 保证NodeManager可以完成任务

#####YARN的容错机制
情景 | 解决对策
:------ | :------
 Application Master不再向ResourceManager发送心跳或者YARN应用停止运行 | Resource Manager尝试重新启动整个应用，默认次数为2
MR任务异常退出或者停止响应 | Application Master尝试在另一个节点上新的container中重新执行该任务，默认尝试次数：4
MR任务失败次数超过限制 | 任务中止，退出
Spark的executor异常停止 | Spark重新启动executor，默认次数为2，超过次数后，Spark认为整个应用异常，退出执行
Spark任务失败 | Spark的Task Scheduler在另外一个executor上重新提交任务
 
#####在YARN上提交MapReduce应用
`hadoop jar MyMR.jar MyDriver mydata outdir`

#####YARN上container的生命周期
 - MapReduce
  * job的每个task(Mapp/Reduce)都会申请一个container
  * 每个Map/Reduce task都有独立的JVM在container中运行
  * task结束时，container会被立即删除
 - Spark
  * Spark应用的每个executor都会申请一个container
  * 一个executor运行一个JVM
  * 每个container的生命周期都会保持到应用结束，即Spark直到应用结束才会释放申请的container

#####YARN上各种应用的Web UI
 - Resource Manager的Web UI  `http://rmhost:8088`
 - MapReduce的Job History Server的Web UI  `http://jhs_host:19888`
 - Spark History Server的Web UI  `http://shs_host:18088`

 
`yarn application -list` 显示所有正在运行的应用信息，包括application ID
`yarn aplication -list -appStates all` 显示集群上所有应用的信息，包括已经结束的application
`yarn application status <application_id>` 查询某个应用的状态

#####停止YARN上的某个应用
 - 在Cloudera Manager的UI界面上操作
 - `yarn application -kill <application_id>`

YARN也有高可用性模式，提供备用的ResourceManager节点。  
开启方法是在Cloudera Master的YARN页面，Actions > Enable High Availability，然后选择运行备用ResourceManager的节点

Spark的SparkHistroyServer本身的log目录：/var/log/spark

#####YARN的log

######YARN 日志聚合  
合并各个node上的日志，由JobHistroyServer执行，也会删除过期日志文件

######MapReduce log
MapReduce的JobHistoryServer的默认log目录是`/var/log/hadoop-mapreduce`

######Spark log
Spark的log可以写到HDFS上，默认允许该设置

Spark application的默认的HDFS上的log目录是`/user/spark/applicationHistory`

Spark History Server的默认log目录是`/var/log/spark`

`yarn logs -applicationId <application_id>` 查看经过YARN聚合的log

####Hadoop Configuration and Daemon Logs
*Service* Hadoop集群的服务，例如HDFS、YARN  
*Role* 角色，负责服务的某个功能，例如HDFS服务需要有NameNode和DataNode角色  
*Role Group* 跨节点对进程进行逻辑分组的划分方式  
*Role Instance* Role Group中的一个成员

不同级别的配置有优先级区别：  
*Service < Role Group < Role Instance*  
高优先级会覆盖低优先级的配置

Cloudera Manager在安装时自动配置了role group  

对于同一个参数，不同的角色可能有不同的值  
对于同一个参数的不同设定值，最小的粒度优先级最高

有些参数修改之后不需要重启，有些则需要重启集群，这些在Cloudera Manager的配置页面上会有图标提示

Cloudera Manager的配置参数，直接改文件的话，如果通过网页重启Hadoop服务，会被数据库中的前台显示的配置覆盖，不能起到效果，需要在网页的配置页面进行修改。

Server和Client的配置文件被保存在不同的位置  
server `/var/run/cloduera-scm-agent/process`  
client `/etc/hadoop/conf`  

Hadoop使用JAVA编写，大部分的配置都保存在xml文件中

使用Add Service可以给集群添加需要的组件，使用Add-on services添加非CDH官方的组件  
通过Clodera Manager添加的组件，参数是根据硬件环境经过调整的，不是CM的默认参数  
Cloudera Manager的推荐的参数配置，是根据最多1500个以上节点的运行经验得出的最佳配置  

cloudera manager的主进程的角色是服务端  
cloudera-scm-agent是cloudera manager的客户端进程，会向cloudera manager发送心跳，也管理本节点上的CDH实例。角色和NodeManager类似

gengeral node

不要使用LVM 单独硬盘损坏会影响整个逻辑分区

#####HDFS NameNode的元数据设置
 - `dfs.namenode.name.dir` 存放NameNode元数据的目录，为保证可靠性，至少要配置分配在两个不同磁盘上的路径，数据写入时，会同时写入所有目录下的文件。甚至可以使用NFS，远程文件系统来保证元数据可用

 
#####HDFS DataNode的元数据设置
 - `dfs.datanode.du.reserved` DataNode上的保留空间默认大小是10G，推荐保留25%左右的磁盘空间
 - `dfs.datanode.data.dir` 存放block的目录，可以是一组目录，轮流写入数据，不同的DataNode上可以是不同的目录
 - `dfs.blocksize` block大小，默认是128M
 - `dfs.replication` 数据冗余备份数目，默认是3

#####HDFS的回收站机制
当HDFS文件被删除时，文件会被移动到回收站中，/user/home目录下的.Trash目录，不是直接删除  
因此被删除的数据可以恢复，将它从.Trash目录移出即可  

`fs.trash.interval` 回收站保存文件的期限，超过期限的文件将被永久删除，CM的默认设置是1440分钟，即一天。当这个值被设置为0时，将会禁用回收站功能

#####HDFS内存设置
推荐为系统运行保留3G的内存  
对于NameNode，推荐一般每百万个block对应1G内存  
推荐的DataNode内存最小是1G，最大是4G

#####Hadoop Daemon log
集群运行时产生的log，包括Name Node，DataNode, Node Manager, Job History Server等

#####Application log
任务输出的log，Application Master, MapReduce tasks, Spark executor
等，包括YARN的container输出的log

每个Hadoop cluster daemon都有一个单独的log文件

Cloudera Manager提供根据角色管理节点log的功能，在YARN上分为Node Manager, Resource Manager, Job History Server；在HDFS上分为Data Node, Name Node, Journal Node

######log文件大小限制
Cloudera Manager默认的单个log文件大小是200M，log文件数量是10个，因此单个节点默认的最大log体积也就是2G


每个Cloudera的进程daemon会输出两个文件：

 - .out文件 合并在daemon启动时输出的stdout和stderr
 - .log文件 记录诊断问题时的输出

Planning your Hadoop Node
存储引擎 Hadoop
计算引擎 YARN

NameNode和YARN的ResourceManager并行设置，实现集群高可用性架构

#####上传数据到HDFS
hdfs dfs put的命令行方式
使用Flume上传外部数据  
使用Sqoop上传关系型数据库中的数据  
使用WebHDFS/HttpFD的REST API通过http请求上传数据

####Hadoop集群规划
HDFS负责存储数据，YARN负责使用数据，HDFS和YARN可以部署在一个集群中

集群节点安装角色不同，可以分为worker node和master node  
worker node上运行Data Node, Node Manager或者Impala Server daemon  
master node上运行Name Node daemon, Name Node备份或Secondary NameNode daemon，或者Resource Manager daemon  
在小型集群中，NameNode和ResourceManager可以运行在同一个节点上，又是Secondary NameNode也在同一个节点

Hadoop节点通常最终要的性能是磁盘IO和网络IO速度，但是如果任务需要执行大量的计算，节点的CPU性能也会是重点

最好使用专门的磁盘存储操作系统和log，用其他磁盘存储Hadoop的数据

机械硬盘的性价比更高，但是SSD可以为使用磁盘缓存中间数据的MapReduce提供更快的读写速度。

工作节点上的磁盘阵列不需要做RAID，RAID 0会保存两份数据，但是HDFS本身已经保存了三个备份，而且raid 0的读写速度受所有磁盘中读写速度最慢的那一块限制，无法实现多个磁盘并行读写

刀片服务器由于需要专用的交换机，而且内存与硬盘容量价格较高，不易扩展，不适合用于Hadoop集群


#####Impala
使用递归树模型处理数据
适用于Tb级别的数据量，不适合Pb级别
查询时间是分钟级别，多用于即时查询
Impala Server 在worker节点上impala进程，作为impala的计算引擎存在

hive建表之后，Impala还需要刷新才能看到新表的存在
impala支持的建表语句不如Hive多样


Worder层面会尝试重新执行三次任务，Master层面，AM会尝试重新提交一次任务 重复执行次数2 * 4

Virtualization
如果没有官方支持，最好不要在虚拟环境使用Hadoop集群进行正式业务

在Hadoop集群中，节点之间最好使用hostname进行通信，防止IP变化导致集群不可用

> 测试磁盘的IO速度`hdparm -t /dev/sda1`
> Hadoop集群节点应该有70MB/S以上的读写速度，否则可能出现问题

集群节点的系统中，需要减少使用交换分区
设置/etc/sysctl.conf中的vm.swappiness为1

Hive的表分为Managed(默认)和External两类，默认的hive存储目录是/user/hive/warehouse  
Hive不是RDBMS，使update和delete操作的效率很差

HiveServer使用ZooKeeper来支持客户端并发操作

Pig 脚本方式操作HDFS数据，类似PL/SQL，将HDFS文件以表的形式读取，进行各种操作，然后输出到HDFS，使用的脚本语言成为Pig Latin

####Hadoop Client

Hadoop Client的定义

 - 有可以接入Hadoop的物理连接
 - 有Hadoop的API
 - 可以获取NameNode等组件的信息

命令行的Hadoop Client有hadoop shell，pig shell, sqoop的命令行界面  
客户端形式的Hadoop Client有Flume agent，Hive server，Oozie  
Hadoop中Map和Reduce任务也符合Hadoop Client的定义

这些Hadoop Client可以通过Cloudera Manager安装然后自动配置，也可以通过yum安装，手动配置

#####Hue
基于Hadoop的各种组件API开发的图形界面查看工具，默认端口是8888  
可以对Hue本身的页面进行权限设置，但是Hue的权限管理系统不能阻止直接查看Hadoop的组件，作用范围仅限于Hue本身

Hue结合Oozie，可以实现以图形化的方式部署并监控执行任务流  

---

HDFS 批量流式写入，write once  
HBASE 随机写入，批量写入的速度略慢，一般用于对速度要求不高的场景  
kudu 支持批量读写  

tez 基于Hive的内存计算引擎

####Hadoop Security
hadoop的配置文件

绝对路径 /opt/cloudera/parcels/CDH-5.10.0-1.cdh5.10.0.p0.41/lib/hadoop/etc/hadoop 
链接路径 /etc/hadoop/conf
core-site.xml
HADOOP_ENV
hdfs-site.xml
yarn-site.xml
mapred-site.xml
hive-site.xml
property.xml

spark的配置文件路径
/etc/spark/conf.cloudera.spark_on_yarn

其他组件的路径类似

CM生成的配置文件存放目录：`var/run/cloudera-scm.../process/`

设定配置可以是集群全局的或者指定某个role group配置

#####HDFS namenode调优

`dfs.namenode.handler.count` namenode节点上允许使用的线程数，CM默认是30，非CM默认是10

#####datanode调优

`dfs.datanode.failed.volumes.tolerated` 允许存在的磁盘异常扇区，CM默认值是0，通常随着磁盘的增加而增加
`locked` datanode最大能使用的内存
`io.compression.codecs` 支持的压缩算法
`mapreduce.job.reduce.slowstart.completedmaps` reduce任务开始执行的map任务完成数目
`mapreduce.reduce.shuffle.parallelcopies` MR的shuffle and sort阶段的备份数目，CM默认值是10

`mapreduce.map.speculative` 是否允许堆积Map tasks，CM默认是false，
`mapreduce.reduce.speculative` 是否允许堆积Reduce tasks，CM默认false

HDFS HA Architecture

ZooKeeper
ZooKeeper Ensample做决定，Journal Node提供决策依据，ZooKeeper failover Controller实际执行NameNode的active/standby切换

fencing methods

####Hadoop Security

Kerberos
KDC
权限最小原则

####Managing Resources

#####Linux Control Groups

mesos

Fair scheduler

最小分配原则

`su -u hdfs hdfs dfsadmin -safemode enter` 进入安全模式
`hdfs dfsadmin -safemode leave` 退出安全模式

`hadoop distcp srcnode destnode` 可以从两个节点之间复制数据，使用MapReduce实现，直接拷贝目录，而且会自动检查文件的checksum
也可以在集群内部进行拷贝

集群节点之间配置差距太大，也可能导致资源倾斜

rebalance 节点间重新进行负载均衡
`dfs.datanode.balance.bandwidthPerSec` 负载均衡使用的每秒带宽
推荐设置是带宽*0.1，这里带宽的bps和每秒带宽的B/s有区别，8 bit = 1 Byte
对于1Gbps的网络，推荐的设置是10 MB/s

升级CDH时一定要进入安全模式，停止HDFS的操作

设置yum源repository之后，可以通过本地yum方式进行手动安装

利用JMX协议获取Cloudera Master的监控数据
