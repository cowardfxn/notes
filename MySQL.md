
# MySQL

###数据库初始化配置
##### 创建数据库
`create database apps character set utf8 collate utf8_bin;`  
创建数据库”app“，指定编码为utf8

##### 创建用户
`create user 'apps'@'localhost' identified by '12345';`  
创建用户apps，密码12345，设定只能从localhost访问本地MySQL

`create user 'apps1' identified by '12345';`  
用户apps1可以从任意的域或主机访问当前MySQL

##### 配置用户权限
`grant all privileges on apps.* to 'apps'@'localhost';`  
赋予用户apps从localhost登陆MySQL时，数据库apps里所有表的全部权限

> grant的14个权限
> select, insert, update, delete, create, drop, index, alter, grant, references, reload, shutdown, process, file

`grant select, insert, update, delete, create, drop on CTD.posts to laowang@192.168.1.11 identified by 'obligingneighbor';`  
指定单个表的部分权限

`grant all privileges on *.* to 'admin'@'127.0.0.1' identified by 'administrator';` 
赋予所有数据库的全部权限

##### 刷新权限表
```
flush privileges;
quit;  // 退出
```

###用户管理
#####直接向mysql.user表插入记录:
```
insert into user (host,user,password) values ('%','jss_insert',password('jss'));
flush privileges;
```

#####修改mysql用户密码方式：
 - 使用mysqladmin语法  `mysqladmin -u用户名 -p旧密码 password 新密码`  
 例: `mysqladmin -u root -p 123 password 456；`

 - 直接修改user表的用户口令  
语法：`update mysql.user set password=password('新密码') where User="username" and Host="localhost";`  
`update user set password=password('54netseek') where user='root';
flush privileges;`

- 使用SET PASSWORD语句修改密码  语法：
`SET PASSWORD FOR 'username'@'host' = PASSWORD('newpassword');`
如果是更改当前登陆用户的密码，用`SET PASSWORD = PASSWORD("newpassword");`
实例：

```
set password for root@localhost=password('');
SET PASSWORD FOR name=PASSWORD('new password');
SET PASSWORD FOR 'pig'@'%' = PASSWORD("123456");
```

#####删除用户和撤销权限：
 - 取消一个账户和其权限
 
 ```
 DROP USER user;
 drop user username@'%'
 drop user username@localhost
 ```

- 取消授权用户

 语法：`REVOKE privilege ON databasename.tablename FROM 'username'@'host';`

 例子:

 ```
 REVOKE SELECT ON *.* FROM 'pig'@'%';
 REVOKE SELECT ON test.user FROM 'pig'@'%';
 revoke all on *.* from sss@localhost ;
 revoke all on user.* from 'admin'@'%';

 SHOW GRANTS FOR 'pig'@'%';     //查看授权
 ```

- 删除用户：
语法: `delete from user where user = "user_name" and host = "host_name" ;`

例子：`delete from user where user='sss' and host='localhost';`


###数据库管理
#####查看所有数据库
数据库默认目录：/usr/local/mysql/data

```
SHOW DATABASES;   //显示数据库
USE abccs         //进入数据库
SHOW TABLES;      //显示表
DESCRIBE mytable; //显示表结构
CREATE DATABASE abccs;    //创建一个数据库
CREATE TABLE mytable (name VARCHAR(20), sex CHAR(1), birth DATE, birthaddr VARCHAR(20));   //创建表
```

#####插入数据
 - 使用INSERT语句  
 `insert into mytable values (‘abccs’,‘f’,‘1977-07-07’,‘china’);`

 - 使用文本方式插入数据

 mysql.txt内容：
 
 ```
 abccs f 1977-07-07 china 　 
 mary f 1978-12-12 usa 
 tom m 1970-09-02 usa
 ```

 将数据文件导入表 *pet*:
 `LOAD DATA LOCAL INFILE "mytable.txt" INTO TABLE pet;`


#####修改数据库或表设置

```
drop database drop_database;   //删除一个已经确定存在的数据库
alter table 表名 ENGINE=存储引擎名；  //修改表的存储引擎
alter table 表名 drop 属性名； //删除字段
alter table 旧表名 rename to 新表名；  //修改表名
alter table 表名 modify 属性名 数据类型；  //修改字段数据类型
alter table 表名 change 旧属性名 新属性名 新数据类型； //修改字段名
alter table 表名 drop FOREING KEY 外键别名； //删除子表外键约束
```

#####修改表字段

```
alter table example add phone VACGAR(20); //增加无约束的字段
alter table example add age INT(4) NOT NULL; //增加非NULL的字段
alter table example add num INT(8) PRIMARY KEY FIRST;  //表的第一个位置增加字段
alter table example add address VARCHAR(30) NOT NULL AFTER phone;  //表的指定位置之后增加字段
alter table example modify name VARCHAR(20) FIRST; //把字段移动到第一位
alter table example modify num INT(8) AFTER phone；//把字段移动到指定字段之后
```
