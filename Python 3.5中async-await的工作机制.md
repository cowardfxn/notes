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

