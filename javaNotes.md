#Java notes

类是创建对象的模板，对象与类的关系类似变量与类型的关系

System.out.println 自带换行符，输出一行，不能格式化输出，只能输出一个字符串  
System.out.print 无换行符，其他类似println  
System.out.printf 无换行符，但是可以进行格式化输出，语法类似C中的printf:  
`System.out.printf("Total number of %s is %d", "list1", 200)`

`static` 定义类变量/类属性，没有被static修饰的变量或属性都是实例变量或实例属性  
`final` 定义不可改变的变量/属性
`transient` 暂时性的变量，支持Java虚拟机  
`volatile` 定义共享变量，可以被多个虚拟机共用  
`synchronized` 多线程并发访问控制

Java的application必须有一个main方法，该方法必须被定义为public并且static的，而且不需要有返回值，有一个字符串参数数组，用于接收启动程序时传入的命令行参数  
static类方法保证main方法被调用时不需要实例化类

####方法内的参数传递
简单类型的参数，直接传值；  
复合类型(数组或类对象)的话传递引用，即数据在内存中的地址

####构造方法
 - 构造方法的名称与类名相同
 - 构造方法不能有返回值
 - 用户不能直接调用构造方法，只能以new方式间接调用

构造方法可以重载，一个类可以有多个参数类型/数目不同的构造方法

Java中对类对象和数据的操作原则是先定义后使用

Java中的垃圾回收由系统(JVM)自动进行，用户也可以使用`System.gc()`发起垃圾回收。  
Object类定义了finallize()方法，用户类可以重写该方法，释放类占用的资源

类方法中不能使用this或者super，在类方法中，实例变量和实例方法只有在初始化了对象之后才能使用。  
在类方法中不能创建内部类的实例。

####类变量的初始化
 - 不能使用构造方法进行
 - 可以考虑使用static代码块进行
 
  ```
  public class Trill extends Drill implements Machine {
    private static float radius = 23.0;
    public float[] partWeights = new float[30];
    Random rdm = new Random(radius);
    static {
        for (int i=0; i < partWeights.length; i++) {
            partWeights[i] = rdm.nextFloat(); 
        }
    } 
}
```

###类
extends 继承关键字  
不止多重继承  
类内使用this表示当前对象，super表示当前类的父类  
`instanceof` 判断对象是否指定类的对象，对于父类也适用  
造型  强制类型转换，不同的数字类型(float, int, long等)，或者强制转换子类对象为父类对象

####抽象类
abstract 定义抽象类/抽象方法的关键字

抽象类中可以只有属性定义，不包含抽象方法；但是包含抽象方法的类，必须被定义为抽象类，前面加上abstract

抽象类不能被直接实例化，必须在被继承之后，实例化子类

final定义的类/方法/属性不能被重写  
因此，`public final abstract class XXX`的类定义方式是错误的，不能通过语法检查

####接口
可以视为一种特殊的抽象类  
只包含常量和方法的定义，但没有变量和方法的实现逻辑  

interface 定义接口的关键字  
implements 使用接口的关键字

一个类可以使用多个接口  

对于使用接口的类，必须实现接口中全部的方法，而且方法的定义形式应该与接口中的定义形式完全相同。  
如果需要对接口的方法进行多态实现，不能在直接使用了接口的类中进行，必须继承了这个类之后，重写父类中实现的接口方法

###包
主要用于管理类，同名类在不同的包中不会有冲突  
包的路径表示文件所在的目录路径

####属性和方法的权限控制

关键字 | 同一个类中 | 同一个包中 | 不同包中的子类 | 不同包中的非子类
----- | :------: | :-----: | :-----: | :-----: 
private | ✔️ |||
default | ✔️ | ✔️ |
protected | ✔️ | ✔️ | ✔️ |
public | ✔️ | ✔️ | ✔️ | ✔️

*default* 不写时的默认状态

内部类中，可以使用`OutClass.this`方式直接访问外部类，取得外部类的属性和方法

###数组
使用大括号表示数组的直接值  
`String[] names = {"Alice", "Bob", "Charlie"}`

直接将一个数组赋值给另一个数组变量，只是传递了该数组的引用，两个变量将会指向同一个物理地址  
数组复制需要使用对应的copy或clone方法

###字符串处理
**String类** 处理不可变的字符串  
**StringBuffer类** 处理可变的字符串

`StringBuffer.capacity()`  查询字符串缓冲区的容量

String对象可以进行常规的切割、查询等操作，返回新字符串或者对应的位置信息；StringBuffer对象则可以进行插入操作，直接更改对象本身

####字符串比较
 - `==` 比较两个String对象的物理地址是否相同
 - `String.equals` 比较两个String对象的字符内容是否相同

###异常处理
`try...catch...finally`  捕捉异常进行处理

#####NullPointerException
除了引用空数组中的元素会触发该异常，引用一个本身为null的空对象，也会触发该异常

*throw* 方法中抛出异常的语句  
`throw new Exception("Here is an error!")`

方法中有异常没有被捕获，直接抛出时，需要在方法定义里用throws声明可能被抛出的异常类型

###输入输入
抽象类*InputStream/OutputStream* 处理字节输入输出，抽象类*Reader/Writer* 处理字符输入输出

**File**类 处理文件操作

四个抽象类各自有子类用于不同需要的处理

###串行化 Serialization
将Java对象转化成字节，便于传输或恢复

###线程操作
有两种创建多线程的方法：

 1. 继承Thread类，在run方法中写入业务逻辑。实例化子类后，调用start方法开始执行
 2. 使用Runnable接口，实现start方法和run方法，start方法中初始化线程，run方法中定义业务逻辑

线程池使用方式类似方式1

####线程死锁
两个(或者多个)线程在锁定了各自使用的资源后，等待锁定对方所使用的资源被释放，造成线程无限期等待的情况

###Applet & JApplet
普通的Java Application定义有main方法，通过命令行调用方式启动  
Applet程序依赖于浏览器，不需要定义main方法，可以在html代码中定义需要执行的applet程序然后启动  
JApplet 类似AWT库，有自己的图形组件

###集合
#####线性集合
共有三种：

 - **Collection** 内部元素无序，允许重复
 - **Set** 内部元素无序，不允许重复
 - **List** 内部元素有序，允许重复

HashSet 存储对象时使用hash方法，因此集合较大时读取效率高

ArrayList**只能存放对象**，不能存放简单数据类型，简单数据类型会变成内存中的地址存储进去，甚至对与整型数，没有`ArrayList.add(int)`这样的方法

#####映射
键值对形势的集合，总接口是Map
有TreeMap和HashMap

######HashMap与HashTable
 - HashTable是同步的，HashMap不是，因此HashTable是线程安全的，各个线程取到的值都是相同的，HashMap则不是线程安全的，需要用户自己保持同步
 - HashTable不允许key或者value是null，HashMap则没有这个限制
 - HashMap有个子类LinkedHashMap，可以保持元素按照插入顺序排列，因此需要有序集合时，可以考虑将HashMap转换为LinkedHashMap，HashTable则不行，内部元素是无序的

对于Java的集合对象，可以获取对象的iterator对象，用`.hasNext()`、`.next()`等方法遍历集合

Collections类中有各种synchronized集合

###网络操作
URL类 通过URL读取数据
Socket类 建立socket，读写数据，关闭socket

socket是基于TCP/IP的，相当于是对TCP/IP协议进行的用户可用化封装

#####TCP/IP与UDP
 - TCP/IP需要先建立连接(三次握手)，然后才能发送数据
 - UDP则是不关心连接是否存在，直接发送一个包含源地址或者目标地址的完整数据包，不关心数据包在传递过程中经过的节点

对于大量数据发送请求来说，UDP效率更高，但是可靠性相对弱于TCP/IP

java.net.DatagramSocket/java.net.DatagramPacket socket数据报文操作用

###JSP
*JSP* JavaServer PagesTM，由Sun公司发起  

将JSP代码嵌入HTML中，在服务器端解析接到的HTML代码时，普通的HTML代码由服务器直接执行，返回给浏览器；JSP代码则由服务器翻译成Servlet文件进行执行，再将结果以JSP代码的形式返回给浏览器
