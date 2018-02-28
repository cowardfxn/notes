# Python 3.5中async/await的工作机制

Python核心开发组成员的身份，让我对于理解这门语言的工作机制充满了兴趣。虽然我一直都明白，我不可能对这门语言做到全知全能，但即便是为了能够解决各种issue和参与一般的语言设计，我觉得有必要去试着常识并理解Python的核心以及内核是如何工作的。

话虽如此，直到最近我才理解了Python3.5中async/await是如何工作的。我所知道的是，Python3.3中的`yield from`和Python3.4中的`asyncio`让这个新语法得以在Python3.5中实现。由于日常工作中没有接触多少网络编程--`asyncio`的主要应用领域，虽然它的能力不止于此--我对async/await并没有关注太多。换个直白点的说法，我知道：

```
yield from iterator
```

(大体)等价于:

```
from x in iterator:
    yield x
```

而且我知道`asyncio`是个事件循环的框架，支持异步编程，还有这些术语所表示的(基本)意义。但没有真正的深入研究async/await语法，分析从最基础的指令到语法功能实现的过程，我觉得我并没有理解Python中的异步编程，这一点甚至让我寝食难安。因此我决定花点时间弄明白这个语法的工作机制。鉴于我听到许多人说他们也不理解异步编程的工作机制，我写出了这篇论文(是的，这篇博文耗费时间之长，字数之多，让我妻子把它叫做论文)。

由于我希望对这个语法的工作机制有一个完整的理解，这篇论文中会出现涉及CPython原理的底层技术细节。如果你不关心这些细节，或者无法通过这篇文章完全理解这些细节--鉴于篇幅，我不能详细解释CPython的每个细节，否则这篇文章就要膨胀成为一本书了(例如，如果你不知道代码对象具有标识，那就别在意代码对象是什么，这不是这篇文章的重点)--那也没什么关系。在每个章节的最后，我都添加了一个易于理解的小结，因此如果你对某个章节的内容不感兴趣，可以跳过前面的长篇大论，直接阅读结论。

#### Python中协程(coroutine)的历史
根据维基百科，“协程是将多个低优先级的任务转换成统一的子任务，以实现在多个节点间停止或唤醒程序运行功能的程序模块”。这句专业描述翻译成通俗易懂的话就是，“协程就是可以人为暂停的函数”。如果现在你觉得，“看起来像是生成器(generators)”，那么你是对的。

生成器的概念在Python2.2时的PEP255中(由于实现了遍历器协议，生成器也被成为生成器遍历器)第一次被引入。主要受到了Icon语言的影响，生成器允许用户创建一个特殊的遍历器，在生成下一个值时，不会占用额外的内存，而实现方式非常简单(当然，在自定义类中实现`__iter__()`和`__next__()`方法也可以达到不存储遍历器中所有值的效果，但也带来了额外的工作量)。举例来说，如果你想实现自己的`range()`函数，最直接的方式就是创建一个整数数组：

```
def eager_range(up_to):
    """创建一个从0到变量up_to的数组，不包括up_to"""
    sequence = []
    index = []
    while index < up_to:
        sequence.append(index)
        index += 1
    return sequence
```

简单明了，但是这个函数的问题是，如果你需要的序列很大，比如0到1,000,000，你必须创建一个包含了所有一百万整数的数组。而如果使用生成器，你就可以好不费力的创建一个从0到上限前一个整数的生成器。所占用的内存也只是每次生成的一个整数。

```
def lazy_range(up_to):
    """一个从0到变量up_to，不包括up_to的生成器"""
    index = 0
    while index < up_to:
        yield index
        index += 1
```

函数可以在遇到`yield`表达式时暂停执行--尽管`yield`直到Python2.5才出现--然后在之后继续执行，这种特性对于节约内存使用有很大帮助，还可以用于实现无限长度的序列。

也许你已经注意到了，生成器所操作的都是遍历器。一种更好的创建遍历器的语法的确很好(当你为一个对象定义`__iter__()`方法作为生成器时，也会收到类似的提升)，但如果我们把生成器的“暂停”功能拿出来，再加上个“把事物传进去”的功能，Python就有了自己的协程功能(在我继续之前，把这个当成Python的一个概念，Python中的协程会在后面详细讨论)。多亏了PEP342，把事物传进一个暂停了的生成器的功能在Python2.5中被引入。抛开与本文无关的内容，PEP342引入了生成器的`send()`方法。这样就不止可以暂停生成器，更可以在生成器停止时给它传回一个值。在上文`range()`函数的基础上更近一步，你可以让函数产生的序列前进或后退：

```
def jumping_range(up_to):
    """一个从0到变量up_to，不包括up_to的生成器
    传入生成器的值会让序列产生对应的位移
    """
    index = 0
    while index < up_to:
        jump = yield index
        if jump is not None:
            jump = 1
        index += jump

if __name__ == '__main__':
    iterator = jumping_range(5)
    print(next(iterator))  # 0
    print(iterator.send(2))  # 2
    print(next(iterator))  # 3
    print(iterator.send(-1))  # 2
    for x in iterator:
        print(x)  # 3, 4
```

在Python3.3时PEP380引入`yield from`之前，生成器都没有太大的变化。严格的说，`yield from`让用户可以简洁方便的从遍历器(生成器最常见的应用场景)获取每一个值，进而重构生成器。

```
def lazy_range(up_to):
    """一个从0到变量up_to，不包括up_to的生成器"""
    index = 0
    def gratuitous_refactor():
        nonlocal index
        while index < up_to:
            yield index
            index += 1
    yield from gratuitous_refactor()
```

同样出于使重构变得简单的目的，`yield from`也支持将生成器串连起来，这样再不同的调用栈之间传递值时，原有代码不需要太大的改动。

```
def bottom():
    """返回yield表达式来允许值通过调用栈进行传递"""
    return (yield 42)

def middle():
    return (yield from bottom())

def top():
    return (yield from middle())

# 获取生成器
gen = top()
value = next(gen)
print(value)  # Prints '42'

try:
    value = gen.send(value * 2)
except StopIteration as exc:
    print("Error!")  # Prints 'Error!'
    value = exc.value
print(value)  # Prints '84'
```

#### 总结
Python2.2引入的生成器使代码的执行可以被暂停。而在Python2.5中引入的允许传值给被暂停的生成器的功能，让Python中协程的概念成为可能。在Python3.3中引入的`yield from`让重构和链接生成器变得更加简单。

### 事件循环是什么？
如果你关系async/await，理解事件循环是什么和它如何让异步编程变得可能非常重要。如果你以前做过GUI编程--包括网页前端工作--那么你已经接触过了事件循环。但在Python的语言体系中异步编程的概念还是第一次出现，不知道事件循环是什么也情有可原。

回到维基百科，事件循环是“在程序中等待、分发事件或消息的编程结构”。简而言之，事件循环的作用是，“当A发生后，执行B”。最简单的例子可能是在每个浏览器中的JavaScript事件循环，当你点击网页某处("当A发生后")，点击事件被传递给JavaScript的事件循环，然后事件循环检查网页上该位置是否有注册了处理这次点击事件的`onclick`回调函数("执行B")。如果被注册了回调函数，那么回调函数就会接收点击事件的详细信息，被调用执行。事件循环会不停的收集事件，循环事件来找到对应的操作，因此被称为“循环”。


在Python中，标准库中的`asyncio`提供事件循环。`asyncio`在网络编程里的一个重要应用，是以当连接到socket的I/O准备好读/写(通过selector模块实现)的事件，充当事件循环中的“当A发生后”事件。除了GUI和I/O，事件循环也经常在执行多线程或多进程代码时充当调度器(例如协同式多任务处理)。如果你理解Python中的GIL(General Interpreter Lock)，事件循环在规避GIL影响方面也有很大的作用。

#### 总结
事件循环提供了一个让你实现“当A发生后，执行B”功能的循环。简单来说，事件循环监视事件的发生，如果发生的是事件循环关心的(“注册”过的)事件，那么事件循环会执行所有被关联到该事件的代码。在Python3.4中引入标准库的`asyncio`使Python也有了事件循环。

### `async`和`await`是怎么工作的

#### 在Python3.4中的工作方式
在Python3.3推动生成器的发展和事件循环以`asyncio`的形式出现之前，Python3.4以并发编程的形式实现了异步编程。从本质上说，异步编程就是无法提取预知执行时间的计算机程序(故称异步，而非同步)。并发编程的代码即使运行在同一个线程中，执行时也互不干扰(并发而非并行)。例如，以下Python3.4的代码中的两个异步并发函数调用，每秒向下计数，互不干扰。

```
import asyncio

# Borrowed from http://curio.readthedocs.org/en/latest/tutorial.html.

def countdown(number, n):
    while n > 0:
        print('T-minus', n, '({})'.format(number))
        yield from asyncio.sleep(1)
        n -= 1

loop = asyncio.get_event_loop()
tasks = [
    asyncio.ensure_future(countdown('A', 2)),
    asyncio.ensure_future(countdown('B', 3))
]
loop.run_until_complete(asyncio.wait(tasks))
loop.close()
```

在Python3.4中，`asyncio.coroutine`装饰器被用于修饰使用`asyncio`并在它的事件循环中执行的函数。这是Python中第一次出现明确的协程定义：一种实装了PEP342中向生成器添加的方法，基类是抽象类`collections.abc.Coroutine`的对象。这个定义让那些原本并无异步定义的生成器也带上了协程的特征。而为了解决这种混淆，`asyncio`规定所有作为协程执行的函数都需要以`asyncio.coroutine`进行修饰。

有了这样一个明确的协程的定义(同时符合生成器的接口)，你可以使用`yield from`将任何`asyncio.Future`对象传入事件循环，在等待事件发生时暂停程序执行(future对象是`asyncio`的一种实现方式，此处不再详述)。future对象进入事件循环后就处于事件循环的监控之下，一旦future对象完成了自身任务，事件循环就会唤醒原本暂停执行的协程继续执行，future对象的返回结果则通过`send()`方法由事件循环传给协程。

以上文代码为例，事件循环启动了两个调用`call()`函数的协程，运行到某个协程中包含`yield from`和`asyncio.sleep()`语句处，这条语句将一个`asyncio.Future`对象返回事件循环，暂停协程的执行。这时事件循环会为future对象等待一秒(并监控其他程序，例如另外一个协程)，一秒后事件循环唤醒返回future对象的被暂停`countdown()`协程继续执行，并把future对象的执行结果归还原协程。这个循环过程会持续到`countdown()`协程结束执行，事件循环中没有被监控的事件位置。稍后我会用一个完整的例子详细解释协程/事件循环结构的工作流程，但首先，我想解释一下`async`和`await`是如何工作的。

#### 从`yield from`到Python3.5中的`await`
在Python3.4中，一个用于异步执行的协程代码会被标记成以下形式：

```
# 这种写法在Python3.5中同样有效
@asyncio.coroutine
def py34_coro():
    yield from stuff()
```

Python3.5也添加了一个作用和`asyncio.coroutine`相同，用于修饰协程函数的装饰器`types.coroutine`。你也可以使用`async def`语法定义协程函数，但是在这样定义的协程函数中不能使用`yield`语句，只允许使用`return`或`await`语句返回数据。

```
async def py35_coro():
    await stuff()
```

对同一个协程概念，添加了多个不同的语法，是为了严格协程的定义。这些陆续补充的语法，使协程从抽象的接口变成了具体的对象类型，让普通的生成器和协程用的生成器有了明显的区别(`inspect.iscoroutine()`方法的判断标准则比`async`还要严格)。

另外，除了`async`，Python3.5页引入了`await`语法(只能在`async def`定义的函数中使用)。虽然`await`的使用场景与`yield from`类似，但是`await`接收的对象是不同的。身为由于协程而产生的语法，`await`可以接收协程对象简直理所当然。但是当你对某个对象使用`await`语法时，技术上说，这个对象必须是可等待对象(awaitable object)：一种定义了返回一个非协程自身的遍历器的`__await__()`方法的对象。协程本身也被认为是可等待对象(体现在Python语言设计中，就是`collections.abc.Coroutine`继承了`collections.abc.Awaitable`)。可等待对象的定义遵循着Python中将大多数语法结构在底层转换成方法调用的传统设计思想，例如`a + b`等价于`a.__add__(b)`或`b.__radd__(a)`。

那么在编译器层面`yield from`和`await`的运行机制有什么区别(例如`types.coroutine`修饰的生成器和`async def`语法定义的函数)呢？让我们看看上面两个例子在Python3.5中执行的字节码细节，`py34_coro()`执行时的字节码是：

```
In [31]: dis.dis(py34_coro)
  3           0 LOAD_GLOBAL              0 (stuff)
              3 CALL_FUNCTION            0 (0 positional, 0 keyword pair)
              6 GET_YIELD_FROM_ITER
              7 LOAD_CONST               0 (None)
             10 YIELD_FROM
             11 POP_TOP
             12 LOAD_CONST               0 (None)
             15 RETURN_VALUE
```

`py35_coro()`执行时的字节码是：

```
In [33]: dis.dis(py35_coro)
  2           0 LOAD_GLOBAL              0 (stuff)
              3 CALL_FUNCTION            0 (0 positional, 0 keyword pair)
              6 GET_AWAITABLE
              7 LOAD_CONST               0 (None)
             10 YIELD_FROM
             11 POP_TOP
             12 LOAD_CONST               0 (None)
             15 RETURN_VALUE
```

除了`py34_coro`多了一行装饰器造成的行号的区别，两组字节码的区别集中在`GET_YIELD_FROM_ITER`操作符和`GET_AWAITABLE`操作符。两个函数都是以协程的语法声明的。对于`GET_YIELD_FROM_ITER`，编译器只检查参数是生成器或者协程，否则就调用`iter()`函数遍历参数(`types.coroutine`装饰器修饰了生成器，让代码对象在C代码层面附带了`CO_ITERABLE_COROUTINE`标志，因此`yield from`语句可以在协程对象中接收协程对象)。

`GET_AWAITABLE`则是另外一番光景了。虽然同`GET_YIELD_FROM_ITER`操作符一样，字节码也接收协程对象，但它不会接收没有协程标记的生成器。而且，正如前文所述，字节码不止接收协程对象，也可以接收可等待对象。这样，`yield from`语句和`await`语句都可以实现协程概念，但一个接收的是普通的生成器，另一个是可等待对象。

也许你会好奇，为什么基于`async`的协程和基于生成器的协程在暂停时接收对象会是不同的？主要目的是让用户不至于混淆两种类型的协程实现，或者不小心弄错相近API的参数类型，进而影响Python最重要的特性的编程体验。就像生成器继承了协程的API，在需要协程时却使用的生成器的情况屡见不鲜。生成器的使用场景不止以协程实现流程控制的情况，需要让用户容易分辨什么时候不应该使用生成器。可是Python不是需要预编译的静态语言，因此在使用基于生成器的协程时编译器只能做到在运行时进行检查。换句话说，就算使用了`types.coroutine`装饰器，编译器也无法确定生成器会担当本职工作还是扮演协程的角色(记住，即使代码中明明白白使用了`types.coroutine`装饰器，依然有在之前的代码中`types = spam`这样的语句存在的可能)，编译器会根据已知的信息，在不同的上下文环境下调用不同的操作符。

对于基于生成器的协程和`async`定义的协程的区别，我的一个非常重要的观点是，只有基于生成器的协程可以真正的暂停程序执行，并把外部对象传入事件循环。当你使用事件循环相关的函数，如`asyncio.sleep()`时，这些函数与事件循环的交互所用的内部的API，事件循环究竟如何变化，并不需要用户担心，因此也许你很少看到这样底层的说法。我们大多数人其实并不需要真正实现一个事件循环的结构，而只是使用`async`协程这样的代码结构来通过事件循环实现某个功能。但如果你像我一样好奇，为什么我们不能使用`async`协程实现类似`asnycio.sleep()`的功能，这就是答案。

#### 总结
让我们总结一下这两个相似的术语。使用`async def`可以定义协程，使用`types.coroutine`装饰器可以将一个生成器--返回一个不是协程的遍历器--声明为协程。`await`语句只能用于可等待对象(`await`不能作用于普通的生成器)，除此之外与`yield from`的功能基本相同。`async`函数定义的协程中一定会有`return`语句--包括每个Python函数都有的默认返回语句`return None`--和/或`await`语句(不能使用`yield`语句)。对`async`函数所添加的限制，是为了保证用户不会混淆它和基于生成器的协程，两者的期望用途差别很大。

### 请把`async/await`视作异步编程的API
David Bzazley的Python Brasil 2015 keynote让我发现自己忽略了一件很重要的事。在那个演讲中，David指出，`async/await`其实是一种异步编程的API(他在Twitter上对我复述了这句话)。我想David要说的是，我们不应该用`asnycio`类比`async/await`，认为`async/await`是同步的，而应该利用`async/await`，让`asyncio`成为异步编程的框架。

David对将`async/await`作为异步编程API的想法深信不疑，他甚至在`curio`项目中实现了自己的事件循环。
