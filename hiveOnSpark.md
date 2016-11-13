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

 > 虚拟机安装玩OS后，需要注意选择指定版本的JDK以及安装OpenSSH(或手动开启ssh服务)
 
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
