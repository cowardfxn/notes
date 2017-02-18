#Hive On Spark集群搭建

步骤概述：

 1. 搭建Hadoop集群，一台Master，两台Slave
 2. 编译Spark程序，使其支持Hadoop2.4.0和Hive(目前官方版本已可选择支持两者的预编译版本)
 3. 运行Hive On Spark测试用例(Spark和Hadoop Namenode运行在同一台机器)

##Hadoop集群搭建

 1. IP规划  
 利用libvirt提供的图形管理界面，创建三台基于KVM的虚拟机  
 资源和IP地址分配如下：
  * **master** 2G 192.168.122.102
  * **slave1** 4G 192.168.122.103
  * **slave2** 4G 192.168.122.104

 > 虚拟机安装OS后，需要注意选择指定版本的JDK以及安装OpenSSH(或手动开启ssh服务)
 
 2. 创建用户和组  
 每台机器上创建名为hadoop的用户组，并添加名为hduser的用户，命令如下：
 
 ```
 groupadd hadoop
 useradd -b /home -m -g hadoop hduser
 passwd hduser
 ```
 
 3. 设置免密码登录
 由于Master远程启动Slave机上的datanode或者nodemanager时需要输入用户名和密码，故设置此项。主要是从Master到Slave机的单向无密码登录。
   
  - 在Master机上生成ssh key
  
  ```
  cd $HOME/.ssh
  ssh-keygen -t dsa
  ```
  
  - 将$HOME/.ssh目录下生成的id\_dsa.pub(公钥)复制为authorized\_keys，然后上传到slave1和slave2机上的\$HOME/.ssh目录，如果目录不存在，则新建出来
  
  ```
  cp id_dsa.pub authorized_keys
  scp authorized_keys slave1:$HOME/.ssh # 此时还需要输入登录用户名密码，这种scp的写法也需要在设置hosts后才能使用
  scp authorized_keys slave2:$HOME/.ssh
  ```
  
 4. 更改每台机器上的/etc/hosts，包括Master机和所有的Slave机，添加以下内容
  
  ```
  192.168.122.102 master
  192.168.122.103 slave1
  192.168.122.104 slave2
  ```

 5. 下载Hadoop(目前可以直接下载集成了Hadoop环境的Spark，这步不再详述)  
 由于后续文件操作权限问题，这里从网站下载程序时最好切换到之前建立的hduser用户  
 下载命令:
 
 ```
 wget http://d3kbcqa49mib13.cloudfront.net/spark-2.0.1-bin-hadoop2.7.tgz
 ```
 
 6. 修改Hadoop配置文件，将以下内容添加到Master机的.bashrc(或其他类似的启动环境设置中)，并确保不会被覆盖掉。
 
 ```
 export HADOOP_HOME=/home/hduser/yarn/hadoop-2.4.0
 export HADOOP_MAPRED_HOME=$HADOOP_HOME
 export HADOOP_COMMON_HOME=$HADOOP_HOME
 export HADOOP_HDFS_HOME=$HADOOP_HOME
 export YARN_HOME=$HADOOP_HOME
 export HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop
 export YARN_CONF_DIR=$HADOOP_HOME/etc/hadoop
 ```
 
 7. 设置JAVA\_HOME  
 修改$HADOOP\_HOME/libexec/hadoop-config.sh，在文件开头添加如下内容：
 
 ```
 export JAVA_HOME=/opt/java
 ```
 8. 修改$HADOOP\_CONF\_DIR/yarn-env.sh  
 在文件开头添加以下内容：
 
 ```
 export JAVA_HOME=/opt/java
 export HADOOP_HOME=/home/hduser/yarn/hadoop-2.4.0
 export HADOOP_MAPRED_HOME=$HADOOP_HOME
 export HADOOP_COMMON_HOME=$HADOOP_HOME
 export HADOOP_HDFS_HOME=$HADOOP_HOME
 export YARN_HOME=$HADOOP_HOME
 export HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop
 export YARN_CONF_DIR=$HADOOP_HOME/etc/hadoop 
 ```
 
 9. xml配置文件修改
 
  - $HADOOP\_CONF\_DIR/core-site.xml
  
  ```
  <?xml version="1.0" ebcoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>fs.default.name</name>
        <value>hdfs://master:9000</value>
    </property>
    <property>
        <name>hadoop.tmp.dir</name>
        <value>/home/hduser/yarn/hadoop-2.4.0/tmp</value>
    </property>
</configuration>
  ```
  
  - $HADOOP\_CONF\_DIR/hdfs-site.xml
  
  ```
  <?xml version="1.0" ebcoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>dfs.replication</name>
        <value>2</value>
    </property>
    <property>
        <name>dfs.permissions</name>
        <value>false</value>
    </property>
</configuration>
  ```
  
  - $HADOOP\_CONF\_DIR/mapred-site.xml
  
  ```
  <?xml version="1.0"?>
<configuration>
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
</configuration>
  ```
  
  - $HADOOP\_CONF\_DIR/yarn-site.xml
  
  ```
  <?xml version="1.0"?>
<configuration>
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <property>
        <name>yarn.nodemanager.aut-services.mapreduce.shuffle.class</name>
        <value>org.apache.hadoop.mapred.ShuffleHandler</value>
    </property>
    <property>
        <name>yarn.resourcemanager.resource-tracker.address</name>
        <value>master:8025</value>
    </property>
    <property>
        <name>yarn.resourcemanager.scheduler.address</name>
        <value>master:8030</value>
    </property>
    <property>
        <name>yarn.resourcemanager.address</name>
        <value>master:8040</value>
    </property>
</configuration>
  ```
  
  - $HADOOP\_CONF\_DIR/slaves  
  向该文件中添加以下内容：
  
  ```
  slave1
  slave2
  ```
  
10. 创建在上一步中$HADOOP\_CONF\_DIR/core-site.xml指定的tmp目录  
    ```
    mkdir $HADOOP_HOME/tmp
    ```

11. 复制YARN目录到所有slave机

    ```
    for target in slave1 slave2
    do
        scp -r yarn $target:~/
        scp $HOME:/.bashrc $target:~/
    done
    ```

12. 在master机上格式化namenode

    ```
    bin/hadoop namenode -format
    ```

13. 启动cluster集群

    ```
    sbin/hadoop-daemon.sh start namenode
    sbin/hadoop-daemons.sh start datanode
    sbin/yarn-daemon.sh start resourcemanager
    sbin/yarn-daemons.sh start nodemanager
    sbin/mr-jobhistroy-daemon.sh start historysrver
    ```
 **daemon.sh表示只在本机运行，daemons.sh表示在所有cluster节点上运行。**

14. 编译Spark  
目前已有可下载的集成环境，此处只记述编译指令。  
需要安装scala相关的sbt工具。
    ```
    SPARK_HADOOP_VERSION=2.4.0 SPARK_YARN=true SPARK_HIVE=true sbt/sbt assembly
    ```

15. 创建运行包  
紧接上一步，挑选编译之后需要的文件，打包压缩。  
SPARK运行时需要的文件目录包括：  

    ```
    $SPARK_HOME/bin
    $SPARK_HOME/sbin
    $SPARK_HOME/lib_managed
    $SPARK_HOME/conf
    $SPARK_HOME/assembly/target/scalca-2.10
    ```
将上述文件内容复制到/tmp/spark-dist，然后创建压缩包

    ```
    mkdir /tmp/spark-dist
    for i in $SPARK_HOME/{bin, sbin,lib_managed, conf, assembly/target/scala-2.1.0}
    do
        cp -r $i /tmp/spark-dist
    done
    cd /tmp
    tar czvf spark-1.0-dist.tar.gz spark-dist
    ```

16. 上传运行包到master机
    
    ```
    scp spark-1.0-dist.tar.gz hduser@192.168.122.102:~/
    ```

17. 配置master机上的Hive On Spark  

 - 以hduser用户登录master机，解压spark-1.0-dist.tar.gz
    
    ```
    tar zxvf spark-1.0-dist.tar.gz
    cd spark-dist
    ```
 - 更改conf/spark-env.sh中的环境变量
 
    ```
    export SPARK_LOCAL_IP=127.0.0.1
    export SPARK_MASTER_IP=127.0.0.1
    ```

然后就可以运行Spark程序了。  
此教程使用的Spark版本较低，实际使用时应考虑酌情删减或修改配置项目。



#Hive表的配置

####托管表
Hive创建表时的默认配置，将数据存储到数据仓库目录(warehouse directory)下

创建一个托管表
`create table student (classNo string, stuNo string, score int) row format delimited fields terminated by ',';`

向表中加载外部数据
`load data local inpath '/home/user/input/student.bin' overwrite into table student`

####外部表
告诉Hive数据的外部引用地址，Hive不会将这些数据存入数据仓库

创建外部表
`create external table teacher (classNo string, teacherName string) row format delimited fileds terminated by ',' location '/user/hive/external/teacher';`

location后的路径是目录名，Hive会加载该目录中的所有文件

加载外部数据
`load data inpath '/user/hive/teacher_02.bin' into table teacher;`
该语句会将`/user/hive/teacher_02.bin`文件复制到`/user/hive/external/teacher`目录下

如果使用的是本地文件，则需要在inpath前加上local选项
`load data local inpath 'F:/123/a.bin' into table teacher;`

####删除表
`Drop table teacher;`

drop语句将会删除Hive中表名对应的表的元数据，但是不会删除表里的数据
即数据仓库或外部地址下，原来表里的数据仍然会存在

####分区和桶
Hive通过分区来组织表，通过分区列来对表进行粗粒度的管理。

表的分区可以基于多个维度，以增加查询效率。

创建指定分区的表
`create external table yarnlog (createdTime string, category string, message string) partitioned by (date string, type string) row format delimited fields terminated by '\t';`

创建了包含createdTime、category、message、date、type 5个字段的表yarnlog  
可以使用`describe yarnlog`命令进行查看  
`partition by`紧跟在create table内容之后  

加载数据到该表的指定块  

```
load data local inpath '/home/user/input/20140102/info' into table yarnlog partition(date='2014-01-02', type='info');
load data local inpath '/home/user/input/20140102/warn' into table yarnlog partition(date='2014-01-02', type='warn');
load data local inpath '/home/user/input/20140413/error' into table yarnlog partition(date='2014-04-13', type='error');
```

加载数据时必须明确指定partition的字段值，因为load操作只会复制数据文件而**不会读取文件内容**

查看表的分区状况
`show partitions yarnlog`

表或者分区可以进一步划分为桶(bucket)，桶提供了额外的结构信息，提高查询效率。  

桶的主要作用有两点：

 1. 提高特定条件下的查询效率
 2. 更高效的执行取样操作

创建分桶的表

```
crate table student_bucketed (classNo string, stuNo string, score int) clustered by (classNo) sorted by (classNo) into 4 buckets row format delimited fields terminated by ',';
set hive.enforce.bucketing = true;
insert overwrite table student_bucketed select * from student;
```

sorted by声明桶为排序桶，可以进一步提高map效率，属于可选设置  
*桶的划分是根据列值的hash值对桶的个数取余而来*  

`set hive.enforce.bucketing = true;`作用是告诉Hive，Reduce的个数是和桶的个数一样的  
如果不设置此属性值，需要用户指定`mapred.reduce.tasks`的值。

对分桶表进行取样  
取出三分之一左右的数据
`select * from student_bucketed tablesample(bucket 1 out of 3 on classNo);`


####存储格式
Hive的存储格式有两种：文件格式(file format)和行格式(row format)  
创建表时默认的格式是文件格式，每行一个数据行  
默认的行内分隔符不是tab，而是Ctrl+A(对应的ASCII码是1)  
默认的集合内分隔符是Ctrl+B，用于分隔array，map及struct中的键值  
表中的各行以换行符分隔

`crate table ...`语句如果不指定任何分隔符，等价于以下语句：

```
create table 表名 (表内个字段声明)
row format delimited
fields terminated by '\001'
collection items terminated by '\002'
map keys terminated by '\003'
lines terminated by '\n'
stored as textfile;
```

`stored as textfile`指定存储格式为文本文件  
另外有一种存储为二进制文件的存储格式  

####导入数据
导入数据的方式上面已有介绍  
Hive不支持`insert into table (values);`这样的语句

#####select创建新表

```
create table 新表名
as
select col1, col2, ...
from src_table;
```

#####修改表

```
alter table 表名 rename to 新表名;
alter table 表名 add columns (列名 列类型);
```

还有其他的删除修改列的语法

#####使用已有表的结构创建新表

`create table 新表名 like 旧表;`  
该语句创建一个与旧表结构相同的新表，但是没有数据。

###Hive查询

#####sort by
使用方式类似SQL  
可以使用distribute by指定特定行被同一个Reduce处理  
`select classNo, studentNo, score from student distribute by classNo sort by score;`

如果建表时没有分桶或者分桶了但没有指定`hive.enforct.bucketing`为true，则需要设置`mapred.reduce.tasks`，数值至少是classNo的存在不同值的数目
`set mapred.reduce.taskt = 3;`

#####MapReduce脚本
可以使用transform、map、reduce等子句调用外部脚本执行指定的操作

```
add file /home/user/score_pass.py;
select transform(classNo, stuNo, score) using 'score_pass.py' as classNo, stuNo, score from student;
```

transform语句传递数据到Python脚本，as指定需要输出的列

####连接(JOIN)
#####内连接
直接join  
`select a.stuNo, b.teacherNo from student a join teacher b on a.clssNo = b.classNo;`

注意：  
Hive**不支持**`select aa.col1, bb.col2, ... from aa, bb where aa.colA = bb.colB;`这样的写法

可以在SQL语句前加上explain查看Hive执行语句的详细计划

#####外连接
left outer join、right outer join、full outer join等，类似SQL的语法定义和使用方式  
要注意的是需要以on的方式使用，而不是直接联表查询

#####半连接(semi join)
Hive不提供in方式的子查询，可以使用left semi join实现相同的功能  
`select * from teacher left semi join student on student.classNo = teacher.classNo;`

右表(student)中的字段只能出现在on子查询中，不允许出现在select的目标列中

#####map连接(map join)
当表非常小，足以整个装载到内存中时，可以考虑使用map连接提高查询效率  
`select \*+map join(teacher)*\ a.stuNo, b.teacherName from student a join techer b on a.classNo = b.classNo;`

连接用到不等值判断时，也适合使用map连接

####子查询(sub query)
使用方式类似SQL

```
select max(avgScore) as maScore
from
(select classNo, avg(score) as avgScore from student group by classNo) a;
```

####视图(view)
类似传统的SQL视图，Hive的视图也只是一个定义，视图数据并不会被存储到文件系统中  
视图是只读的

```
crate view avg_score as
select classNo, avg(score) as avgScore from student group by classNo;
select max(avgScore) as maScore from avg_score;
```

作用于上面的子查询语句相同
