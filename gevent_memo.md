#gevent
- 基于协程的Python网络包
- 特点：  
  - 基于libev的快速事件循环
  - 基于greenlet的轻量级执行基础单位
  - 从Python标准库继承设计思想的API
  - 可以与socket和ssl包共用
  - 可以帮助标准库和第三方包阻塞sockets(通过monkey patching)  
  - 可以通过threadpool或者c-ares执行DNS查询
  - 可以作为TCP/UDP/HTTP服务端
  - 支持子进程
  - 支持线程池


## 安装
pass

## Monkey patching
对于使用标准sockets的库，通过gevent.monkey将顺序执行socket操作的标准库操作方法替换成基于协程的socket方法，加快执行速度。  
```
from gevent import monkey; monkey.patch_all()
import subprocess
```

## Event loop
普通的socket操作会阻塞直到操作完成，而gevent不会阻塞socket，而是在操作完成（收到数据）时通过系统发送完成通知。在不阻塞socket的同时，gevent会切换到下一个greenlet，而此时这个greenlet可能已经收到了数据。这样重复注册事件，在收到完成通知时触发响应操作的过程，就是事件循环。

gevent启动事件循环时默认会新建一个greenlet实例，通过创建gevent.hub.Hub实例实现阻塞，切换到当前操作。

事件循环基于libev，libev是系统默认提供的速度最快的polling mechanism。  
libev的API在gevent.core模块里，通过Hub greenlet实现libev的回调方法，因此gevent的同步方法无法通过libev使用，只能使用异步方法，如gevent.spawn()、gevent.event.Event.set()。

##多任务同步
greenlet之间的运行顺序和系统线程相同，直到一个greenlet触发阻塞或者结束运行，另外的greenlet才有执行机会。  
greenlet间的数据同步意义不大。  
gevent实现的类似线程的方法：

 * Event 允许一个greenlet唤醒多个正在运行wait()方法的greenlet
 * AsyncResult 类似Event，但是可以传值或者异常给waiters
 * Queue和JoinableQueue

##轻量级伪线程
gevent.spawn()创建一个greenlet实例并调用start方法。start方法将当前greenlet的执行顺序提升到正在执行的greenlet之后，在正在执行的greenlet结束执行或者释放线程控制之后立即执行。如果待执行序列中存在多个greenlet，它们会顺序执行。  
greenlet实例的常用方法有：  

 * join 等待到greenlet退出
 * kill 中断greenlet的执行，可以接收一个异常作为参数，会返回该异常；也可以接收timeout参数。
 * get 返回greenlet的执行结果或者它抛出的异常


##Timeouts
gevent的API里有许多同步方法，执行时会阻塞当前greenlet直到执行结束。这些同步方法大多可以通过设置参数block=False转换为异步方式执行。  
很多同步方法都可以接收timeout参数，定义方法阻塞greenlet的时间。



#gevent详述
[gevent For the Working Python Developer](http://sdiehl.github.io/gevent-tutorial/)

`concurrency`  并发

*Only one greenlet is running at any given time.*  
因此协程不是真正意义上的并发。

gevent协程操作的基本单位是greenlet对象  
当spawn启动的方法执行sleep或其他释放线程资源的操作时，线程资源由当前greenlet转向等待队列中的其他greenlet。

```
gevent.joinall([
    gevent.spawn(setter, 4, 6),
    gevent.spawn(getter, 'a1', 'b1'),
    gevent.spawn(setter2, [1, 2, 3])]
)
```
*指定协程队列*

gevent.pool.Group 指定一组greenlet一起执行，便于异步方法的管理，group实例可以同步执行，也可以异步执行。  
gevent.pool.Pool 可以动态调整大小，限制greenlet并发数量的结构。


