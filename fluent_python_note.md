#Fluent Python笔记


####构建扑克牌

```
import collections
Card = collections.namedtuple('Card', ['rank', 'suit'])

class FrenchDeck:
    ranks = [str(n) for n in range(2, 11)] + list("JQKA")
    suits = "spades diamonds clubs hearts".split()
    def __init__(self):
        self._cards = [Card(rank, suit) for rank in ranks for suit in suits]
        def __len__(self):
            return len(self._cards)
        def __getitem__(self, position):
            return self._cards[position]
```

####关于私有方法(双下划线包围的方法)
> The first thing to know about special methods is that they are meant to be called by the Python interpreter, and not by you. 

####重写私有方法，使用常见的运算符操作非标准对象
 
```
import math
from math import hypot
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __add__(self, v2):
        x = self.x + v2.x
        y = self.y + v2.y
        return Vector(x, y)
    def __mul__(self, n2):
        if isinstance(n2, Vector):
            x = self.x * n2.x
            y = self.y * n2.y
        else:
            x = self.x * n2
            y = self.y * n2
        return Vector(x, y)
    def __abs__(self):
        # return math.sqrt(self.x**2 + self.y**2)
        return hypot(self.x, self.y)
    def __str__(self):
        return self.__repr__()
    def __repr__(self):
        return "Vector({}, {})".format(self.x, self.y)
    def __bool__(self):
        # return bool(abs(self))
        return bool(self.x or self.y)


v1=Vector(4, 5)
v2=Vector(3, 4)

v1 + v2
v1 - v2
v1 * 7
v1 * v2
bool(v1 * 0)
```

####字符串格式化时不常用的格式符
 `"%r" % str1`  %r表示对象标准的显示形式

####关于\_\_repr\_\_与\_\_str\_\_
print会隐式调用\_\_str\_\_，而如果一个类中没有定义\_\_str\_\_，则会调用\_\_repr\_\_替代，而如果\_\_repr\_\_也没有定义，则print时会直接显示对象的内存地址，类似"\<Vector object at 0x10e100070\>"  
\_\_str\_\_的目的是增加对象的可读性，即使因此而无法表示对象内在。
\_\_repr\_\_的目的是为了消除歧义，尽可能清晰的描述对象，而不考虑可读性。

####filter函数在Python3中的改动
filter Return an iterator yielding those items of iterable for which function(item) is true. If function is None, return the items that are true.

返回的是生成器而不是直接返回过滤后的数组  
而如果不传入过滤函数，则默认会返回bool值是True的元素，某些场合可以作为过滤器使用

#####标准库函数在基本类型上的性能优化
len函数的参数是标准数据类型(str, list, memoryview等)时，会直接从内存中的一个C结构体中读取长度信息，而不是遍历。

####生成器表达式 generator expressions
使用括号围起来，内部语法类似*list comprehension*:

`g1 = ("{}.{}".format(s, t) for s in l1 for t in l2)`

直接返回generator，数据量较大时可以考虑代替*list comprehension*

####\*变量的使用扩展
使用\*指向的args变量捕获多出的参数，这是Python的经典特性，在Python3中，这个特性被扩展到了多重赋值的场景中

```
>>> a, b, *c = range(2, 10)
>>> a, b, c
(2, 3, [4, 5, 6, 7, 8, 9])
>>> c
[4, 5, 6, 7, 8, 9]
>>> a, b, *c = range(1, 3)
>>> a, b, c
(1, 2, [])
>>> a, *b, c = range(2, 10)
>>> a, b, c
(2, [3, 4, 5, 6, 7, 8], 9)
>>> *a, b, c = range(2, 10)
>>> a, b, c
([2, 3, 4, 5, 6, 7], 8, 9)
>>> 
```

#####多重赋值使用实例
多重赋值也可以处理嵌套结构或者包含嵌套结构的iterable

```
for a, (b, (c, d)), e, f in l1:
    ...
```

####namedtuple使用
**namedtuple** 工厂类，返回类名和指定tuple列名的类，使用时再通过该类创建对象
使用namedtuple定义的类所创建的对象，比普通类对象要小一些，因为属性被保存在预创建的__dict__中  
可以使用A.b的形式从对象中直接读取数据，但不同的是不允许对数据进行直接修改。而如果是数据是可变对象，则可以通过修改可变对象实现对数据的修改，这点需要注意

```
>>> from collections import namedtuple
>>> City = namedtuple('SelfDefCity', "name country population")  # 初始化可以使用空格分隔的列名字符串
>>> Country = namedtuple("CommonCountry", ["name", "leader", "foundation_date"])   # 也可以使用列名数组
>>> ulyses = City("Ulyses", "Fiction", "10billion")
>>> vest = Country("Vest", "Siri", "Only God knows")
>>> ulyses.name
'Ulyses'
>>> vest[1]
'Siri'
>>> ulyses[1:3]
('Fiction', '10billion')
>>> 
```

####关于数组切割
可以使用省略号对多维数组进行切割，`x[i, ...]` 等价于 `x[i, :, :, :]` (如果x是四维数组)

```
>>> l1 = list(range(10))
>>> l1
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
>>> l1[4:7]
[4, 5, 6]
>>> l1[4:7] = (12, 20)  # 对切片进行赋值操作可以直接改变原可变对象的值
>>> l1
[0, 1, 2, 3, 12, 20, 7, 8, 9]
>>> l1[2:4] = 100  # 赋值切片必须使用iterable对象
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: can only assign an iterable
>>> l1[2:4] = "qwe"
>>> l1
[0, 1, 'q', 'w', 'e', 12, 20, 7, 8, 9]
>>> l1[6:9] = [100]  # 即使对象只有一个元素，赋值时也只会覆盖
>>> l1
[0, 1, 'q', 'w', 'e', 12, 100, 9]
>>> 
```

这种inplace方式的赋值操作，提供了直接操作list的可选方法

```
>>> l1[2:] = l1[5:]  # 删除2:5之间的元素
>>> l1
[0, 1, 12, 100, 9]
>>> 
```


####增量操作 += *= 
默认使用\_\_iadd\_\_、\_\_imul\_\_方法，如果未定义则使用\_\_add\_\_、\_\_mul\_\_
\_\_iadd\_\_、\_\_mul\_\_ 表示inplace更新原变量，\_\_add\_\_、\_\_mul\_\_则是创建新的对象，赋给原变量  

#####查看Python字节码运行情况
可使用`dis.dis()`查看在字节码层面Python代码运行状况

产生in-place变化的标准库函数，会返回None以示没有创建新的对象，只是修改了原对象
sorted函数接受任何iterable对象作为参数，返回排序后的数组。甚至中文字符串也可以作为参数使用
Python默认的排序算法是Timsort，有点是当两个元素排序权重相同时，会保留两个元素原来的先后顺序


####bisect 二分查找模块
`bisect.bisect` 是bisect.bisect_right的别名，默认返回查找到的元素后的位置，可直接供list.insert作为插入位置使用  
`bisect.bisect_left` 返回查找到的元素所在的位置  
二者的区别在于找得到元素时的返回结果

```
>>> bisect.bisect_left([60, 70, 80, 90], 70)  # 返回元素所在位置下标
1
>>> bisect.bisect([60, 70, 80, 90], 70)  # 返回元素后一个位置的下标
2
>>>
而如果找不到，则都会返回所在区间的左值
>>> bisect.bisect_left([60, 70, 80, 90], 78)
2
>>> bisect.bisect([60, 70, 80, 90], 79)
2
>>> 
```

bisect.bisect和bisect.bisect_left都接收*lo、hi*来限制检索下标范围

######分段分布应用
```
import bisect
def grade(score, breakpoints=[60, 70, 80, 90], grades="FDCBA"):
    i = bisect.bisect(breakpoints, score)
    return grades[i]

[grade(score) for score in [33, 99, 77, 70, 89, 90, 100]]
['F', 'A', 'C', 'C', 'B', 'A', 'A']
```

`bisect.insort(seq, item)` 将元素插入数组中，并保持数组为升序


####list之外的序列类型
如果有100亿个浮点数，使用**Array**存储或排序比list更适合。  
Array会像C那样保存实际的数值，而list则会保存float对象，相比之下使用Array所占的内存空间更小

如果需要对序列频繁进行FIFO或LIFO的进栈/出栈操作，deque效率更高  
如果需要进行频繁的存在性检查(*a in seq ...*)，可以考虑使用对应的**Set**对象

 - **Array**  
    如果序列中所有元素都是数字，那么使用array.array比list效率更高  
    用法类似list，但是在新建时通过typecode指定内部元素的数据类型，所有元素必须是指定的类型，如果插入的元素不是指定的格式，则会将其转换为对应的格式进行存储，而如果无法进行转换，则会报出TypeError  
    pickle.dump会默认处理所有的标准类型数据，存储成文件时，速度和array.tofile接近  
    `array.typecode` 获取array的类型标识  

 - **memoryview**  
返回指向一个序列内存地址的对象，类似C的指针，不同的数据结构中，同一memoryview类构建的对象操作的内存相同  
机制与numpy中的array相同

 memoryview.cast 改变字节处理的方式，可以使相同的数据被作为不同的类型处理(二进制、八进制、十六进制等)  
 主要用于处理大量数据的情况

    ```
    >>> numbers = array('h', [-2, -1, 0, 1, 2])  # 'h' signed integer
    >>> memv = memoryview(numbers)
    >>> len(memv)
    5
    >>> memv
    <memory at 0x101d62ac8>
    >>> memv[0]
    -2
    >>> memv_oct = memv.cast('B')  # 'B' unsigned char 按ascii码的标准，8位表示一个字符，转换memoryview类型，以unsigned char类型读取内存数据
    >>> memv_oct.tolist()
    [254, 255, 255, 255, 0, 0, 1, 0, 2, 0]
    >>> memv_oct[5] = 4
    >>> numbers
    array('h', [-2, -1, 1024, 1, 2])
    >>>
    ```

 memoryview对象的切片也是memoryview

 - **numpy.ndarray**
 
    ```
    a1 = np.arange(100)  # 一维数组
    a1.shape = 4, 25  # inplace改变数组结构，reshape会返回新的数组
    a1.transpose()  # 转置，返回新的转置后的数组
    ```

 - **collections.deque**
 线程安全
 可以在两端操作，方法类似list，但是pop、append、extend都支持popleft、appendleft、extendleft
 list的pop操作支持pop(n)，但是deque的pop不能传入参数，只能在两端操作
 
    ```
    >>> from collections import deque
    # 可以设定最大长度，达到最大长度后，如果继续插入数据，会在另外一端丢弃元素
    >>> d1 =deque(range(10), maxlen=10)
    >>> d1
    deque([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], maxlen=10)
    >>> d1.rotate(4)  # 从一端取出n个元素，放到另一端，整数表示右端
    >>> d1
    deque([6, 7, 8, 9, 0, 1, 2, 3, 4, 5], maxlen=10)
    >>> d1.rotate(-5)  # 负数表示从左端取数据，放在右端
    >>> d1
    deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 0], maxlen=10)
    >>> d1.extend("blur")  # 默认从右边插入新元素
    >>> d1
    deque([5, 6, 7, 8, 9, 0, 'b', 'l', 'u', 'r'], maxlen=10)
    # 从左边插入元素时，实际上是遍历参数，依次从左端插入，因此最后结果里，新插入的元素显示的顺序和参数中的相反
    >>> d1.extendleft([11, 12, 13, 14])
    >>> d1
    deque([14, 13, 12, 11, 5, 6, 7, 8, 9, 0], maxlen=10)
    >>> 
    ```

#####其他序列
######Queue模块
`from Queue import Queue, LifoQueue, PriorityQueue`  
*Queue、LifoQueue、PriorityQueue*  
都是线程间同步的，线程安全，用于在线程间进行安全的通信  
实例化时需要设定maxsize，默认是0，当Queue长度达到maxsize时，新的插入操作会一直等待，直到其他线程释放了空间出来  

######multiprocessing模块
multiprocessing模块有私有的Queue，主要用于进程间的通信  
还有multiprocessing.JoinableQueue用于简化任务管理

######asyncio模块
Python3.4引入，实现了Queue、LifoQueue、PriorityQueue和JoinableQueue，功能类似Queue模块和multiprocessing模块，用于任务管理和异步功能实现

######heapq模块
没有实现队列方法，用于产生一个a[k] <= a[2*k+1] and a[k] <= a[2*k+2]的序列，因此产生的序列中，a[0]始终是最小的  
具体用途未知


>操作对象是immutable对象时，Python通常会创建新对象，如果是muttable对象，则可能进行in-place操作

---

MEMO

 * flat sequences, container sequences
 根据序列元素区分，flat sequences的元素是基础类型的，number、string、bytes等；container sequences的元素是复杂的类对象
 * generator expression g1 = (e**5 for e in range(10))
 * set comprehension s1 = {e*2 for e in range(10)}
 * namedtuple的_asDict()方法输出的是OrderedDict对象
 * 类似sort和sorted，max、min函数也支持key参数

##dict&set

**dict.setdefault(k, [default])**  如果k在字典中存在，则返回d[k]，否则设置d[k]=default，然后返回对d[k]的引用

```
>>> d1={}
>>> r1 = d1.setdefault('ro', range(12))
>>> id(r1)
4323921376
>>> id(d1['ro'])  # 二者id相同，是对同一个对象的引用
4323921376
>>> r1
range(0, 12)
>>> r1 = list(r1)
>>> r1
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
>>> d1
{'ro': range(0, 12)}  # 如果对r1进行非in-place的操作，则会将其引用指向另外的对象，而无法再操作原dict元素
>>> d1['ro']
range(0, 12)
>>> id(r1)
4325181384
>>> id(d1['ro'])
4323921376
>>> 
```

setdefault的用途主要在于简洁的处理字典键值引用和赋值，完成两步操作只需要对字典的键进行一次检索，然后保留对该键值的引用，以备后续处理  
`d1.setdefault('ABC', []).append("base")`  
相对而言，用dict.get方法就需要先进行存在性判断，然后进行赋值，对字典内键的检索都要至少进行两次  
setdefault主要用于更新*键值可变的key*时的操作  

dict.update  参数可以是字典(带有keys方法)，也可以是键值对序列
方法执行时，会先检查参数是否有keys方法，如果有，则视为字典进行更新，如果没有，则会使用Python内置的update逻辑，将参数视为键值对序列进行解析和更新

######this的实现
```
import this
from codecs import decode
print(decode(this.s, "rot-13"))
```
this的原文是rot-13转码后存储在this.s中的，因此如果要展示this内容，需要对this.s进行rot-13解码。

**dict.__missing__** 只有在__getitem__取不到键值时会被触发，即仅在d1[k]形式的调用时触发，dict.get和k in d1的操作都不会触发

collections模块中的其他方法

 - **collections.ChainMap**  建立一个字典的组合，查找键值时按顺序在每个字典中查询，直到找到为止
 - **collections.Counter(iterable)**  统计序列中每个元素出现的次数
  * Counter.update(iterabel)  使用新的序列更新原Counter的结果
  * Counter.most_common(n)  返回出现次数最多的前n个统计结果
  * Counter类对象支持直接通过+ - 符号进行操作，在两个Counter对象间直接更新对应键值的统计数字

######重写dict类方法
标准库的Dict类由于性能要求，有些方法使用了非标准的Python语法实现，因此如果直接继承Dict类，可能需要重写这些方法，得不偿失  
如果需要实现自定义的字典类，最好继承**Collections.UserDict**类，可以完整继承所有方法  
UserDict继承自MutableMapping和Mapping，常用的字典方法都有可用的继承实现

######其他类型的字典
 - 在网络编程中，可能需要实现对Mapping的键的大小写不敏感的字典，这时可以使用TransformDict

 - **types.MappingProxyType** Python3.3引入，2.7不支持 创建一个对字典对象的引用，可以通过该引用动态访问字典对象所有的键值，包括最新的改动，但是无法通过MappingProxyType对象修改原字典数据，即创建了“*只读*”字典，修改只能通过直接修改原字典实现

###Set
 - set支持集合逻辑运算，运算符都有内置的反向方法，\_\_and\_\_/\_\_rand\_\_，以及in-place的操作方法，更新原集合  
 - set支持pop，但是不支持pop(n)  
 - set.add 增加元素  

 - 删除元素
  1. **set.discard** 参数元素不存在时不会出错  
  2. **set.remove** 参数元素不存在时，报KeyError  
 - 更新
  1. **set.intersection\_update**  in-place操作，从原集合中删除不属于原集合与所有参数集合的交集的元素，如果所有参数集合是空集，则会删除原集合中所有元素
  2. **set.update** in-place操作，将参数集合中不属于原集合的元素更新进原集合中
  3. **set.symmetric_difference**  返回原集合与参数集合中不同的元素，可理解为返回异或的结果

set集合运算的方法会把可遍历的参数视为单个元素的集合进行运算，而非一个整体，set应该视为flat collection，而非container collection。

#####关于hash函数
对于任意对象，如果 a == b是True，那么hash(a) == hash(b)也必须是True  
所有的用户自定义对象都是hashable的，重写了__eq__/__hash__方法而导致两者不相等的对象，可能会是unhashable的

#####Python中hash table的使用
dict和set都使用了*hash table*，内部使用**稀疏序列**实现数据存储  
查询dict/set时，编译器会先使用hash方法取得key的hash结果，然后根据结果计算出hash table中存储数据的Bucket的偏移量，如果指向的Bucket中存在数据，而且键值对数据的键与key相同(只有当是dict时)，返回该数据/键值对。  
如果Bucket有数据但是键与key不相同，则触发hash collision，一般处理方法是使用新的算法计算偏移量，然后重复上述过程。  
如果Bucket中没有数据，则返回TypeError。

######hash table中元素的顺序
hash table中数据存放的顺序默认是赋值的顺序，但是算法规定其中每个key不光占据自身存储数据的空间，还需要包括附近的一些空的Bucket，如果算法判断当前的hash table空间不足以支持增加新的key，就会重新申请更大的存储空间，然后将数据移动到新的内存空间中。  
这些操作都是在系统层面进行的，对Python API层面而言，字典数据没有变化。  
但产生的影响是无法保证字典内数据在API级别的顺序，因此字典/set都是无序的，而且插入新的元素可能会改变原有元素的顺序。  
由于查询时需要使用key的hash值，set的元素/dict的key 都需要时hashable的。  

> 空间换时间
由于使用了hash table，在大规模数据集查询时，dict、set的查询性能远高于直接使用list
相对的，dict、set的存储也占用了更大的存储空间

#####dict&set的特征
 1. set的元素/dict的key 都需要时可以hash化的对象
 2. 有相当大的内存占用
 3. 成员检查效率很高(键值查询、in判断等)
 4. 元素顺序是插入顺序
 5. 向集合中加入元素可能会打乱原有顺序

##字符编码
 - 编译器读取的数据是字节形式的，而如何理解字节形式的数据，多少字节的数据是一个单位，可以从对应的编码表中读取内容，这些才是字符编码定义所要做的。

struct 结构化处理bytes数据的库  
latin1编码是包括Unicode在内的编码的基础  
cp1252 Windows使用的字符集，latin1的超集，也被成为ANSI  
chardet 识别编码的库，参数字符串如果是bytes，识别准确率会提高不少  
BOM byte-order mark  
UTF-16字符会在开头显示是big-endian还是little-endian  

```
>>> "SDF".encode('utf-16')
b'\xff\xfeS\x00D\x00F\x00'
```

Intel 的x86架构默认为little-endian

**UTF-16LE** little-endian
**UTF-16BE** big-endian

> 在windows中，记事本会在一个UTF-8编码的文件开头加上BOM，而Excel会根据开头的BOM判断文件是否UTF-8编码

**code point** 字符编码数值，表示字符在原编码集中位置的数字

str *encode* => bytes
bytes *decode* => str

str.encode(codecs, error="strict")  
error 定义出现编码错误时的解决办法

 - strict 默认值，返回UnicodeEncodeError异常
 - ignore 跳过无法编码的字符，返回可以正常编码的部分
 - replace 把无法编码的字符替换为'?'
 - xmlcharrefreplace 将无法编码的字符替换为XML实体
 - error还可以是codecs.register_error里定义的用于处理UnicodeEncodeError的方法

bytes.decode(codecs, error="strict")

 - strict 默认值，返回UnicodeDecodeError
 - ignore 跳过无法被解码的字节
 - replace 将无法解码的字节替换为"�"(U+FFFD Unicode中用于表示无法解码的字符)
 - 也可以使用codecs.register_error中定义的用于处理UnicodeDecodeError的方法

#####文件操作
open(filename, mode="w", encoding="utf-8")

#####设置defaultencoding
py3不在支持sys.setdefaultencoding方法，不允许用户设置系统默认编码，因为内部的CPython只支持ASCii码

locale.getpreferredencoding() 文件操作、stdin/stdout/stderr等被重定向到文件，却没有提供编码时，查找系统默认编码的方法
由于系统默认编码可以被改变，因此最好不要依赖默认编码

#####Unicode normalization 
unicodedadta.normalize  

 - NFC Normalization From C
 - NFD Decompose
 - NFKC NFKD  兼容模式，可能会改变原有字符，造成数据丢失

Case folding 将文本转换为小写，Python3.3添加。大部分字符的str.casefold()结果和str.lower()相同，但对于ohm符号等特殊字符，结果不同

`str_u = normalize('NFC', str1)`

`locale.setlocale(LC_COLLATE, 'pt_PR.UTF-8')`  设置locale语言  
`locale.strxfrm` 根据locale设置返回locale兼容的字符串  


####类型注释 3.6新特性
在变量声明时添加类型注释，便于编译器识别程序逻辑错误，但是不强制运行时编译器检查这些多出来的类型注释。

```
a: int = 1
b: dict[str, tuple] = {}
```

当变量是module层面的或者global变量时，只定义类型但没有赋值的话，会产生错误：

```
a: str
```

运行时会出错，该变量未被定义，因此无法引用。  
但是如果是类变量、实例变量或者函数内部变量，则只声明不初始化也可以编译通过。  

编译时的类型注释被保存在\_\_annotations\_\_变量中，该变量是个OrderedDict，但是访问类型注释的标准方式是通过typing.get\_type\_hints
要禁用type annotation，可以设置  
`# type: ignore`  头部声明？  
或  
`@no_type_check`  装饰器？


###Unicode database
Unicode编码表中不仅存放code point与相应的字符形状，还保存着该字符在Unicode编码表中的名称、是否数字、是否字母等元数据。str.isnumeric, isidentifier等方法都依赖于这些元数据实现。

unicodedata模块可以从Unicode字符中读取这些元数据
re的正则表达式，"\d"等通配符可以正确匹配部分的数据，但不是全部

字符串长度较长时，可以分块输入，然后使用括号围起来表示里边的内容是一个完整的字符串。这个功能是使长字符串书写方便，甚至单独为某一部分添加注释

```
s1 = (
    "12435"
    "ASDDSF"
    "fghert456456"
)
>>> s1
'12435ASDDSFfghert456456'
>>> len(s1)
23
>>> 
```

#####支持两种输入类型的API

 - re模块 string类型的正则表达式可以匹配字符、数字等几乎所有Unicode字符(Python3中)，而bytes类型的正则表达式，则只能匹配ASCII编码范围内的字符，ASCII编码以外的字符，都会被视为非数字也非字母
 - os模块 方法的参数是string类型时，返回的结果也是string类型的；参数是bytes类型时，返回结果也是bytes类型
  * os.fsencode 使用sys.getfilesystemencoding()获取的编码，将string参数解析成bytes；如果参数是bytes类型，则原样返回
  * os.fsdecode 使用sys.getfilesystemencoding()获取的编码，将bytes类型的参数转成字符串；如果参数是string类型，则原样返回

`bytes.decode(codec, "surrogateescape")` 将超过ascii编码的字符替换为范围内的字符


在Windows平台上，以下默认编码可能会有冲突；而大部分的Unix平台上默认编码都是**UTF-8**

 - locale.getpreferredencoding()
 - sys.getfilesystemencoding()
 - sys.getdefaultencoding()
 - sys.stdout.encoding

> Humans use text. Computers speak bytes.

#####字符串在内存中的存储
如果str的内容在latin1编码范围内，则用**1 Byte/字符**的形式存储字符串，否则尝试用**2或4 Byte/字符**的形式存储  
此方式类似Python3存储int数据：如果数字可以存放在一个机器字(machine word)中，则存放在一个字中，否则使用类似Python2中long类型的可变长度方式存储

Unicode使用16位存储字符，现代的Unicode字符可用范围更扩展到了0到1114111(0x10FFFF)  
Unicode 1.1版本合并了ISO 10646  
Unicode标准定义了如何用字符编号(code points，通常用16进制的整数表示)表示人类语言的字符  
> A unicode string is a sequence of code points, which are numbers from 0 to 0x10FFFF(DEC 1114111).  

将Unicode字符串(一系列字节编码组成)转换成可辨识字节的规则叫做encoding。反过来的过程则是decoding  
*re.ASCII* 只匹配ASCII字符  

*UTF* Unicode Transformatting Format  
*UTF-8* 可变长的编码方式，ASCII编码范围内的字符仍然只使用一个字节存储  
UTF-8有无效字符编号的设定，因此即使使用UTF-8进行decode，也还是不能保证完全正确

```
unicode.encode() -> bytes
bytes.decode() -> unicode
```

Python2会将输入的bytes数据自动根据*sys.getsystemdefaultencoding()*进行转码以便内部使用，一般的默认编码是ASCII，“编译器帮助用户处理字符编码”  
Python3将所有的bytes视为Unicode编码的字符，如果无法将bytes使用Unicode解码保存，则直接返回异常

###Function as first class objects -- first-class function

#####Python中七种可调用的类型

 - User-defined functions def和lambda语句定义的函数
 - Built-in functions C代码实现的内部方法，如len、time.strftime等
 - Built-in methods 用C实现的方法，dict.get等
 - Methods 类内部定义的方法
 - Classes 被调用时会调用`__new__`方法创建实例，然后调用`__init__`方法初始化实例，然后将实例返回给调用者。Python中没有new方法，因此调用类和调用函数语法相同。
 - Class instances 定义了`__call__`方法的类的实例，可以被视为函数调用
 - Generator functions 使用了yield关键字的函数或者方法，被调用时返回生成器(generator)


higher-order function 使用函数对象作为参数或返回值的函数  
函数式编程的语言通常会提供通用的map、filter、reduce函数

如果参数是iterable对象，map、filter可以被listcomp(Python2)或genexp(python3)替代
reduce常用语累加，有内置的sum方法可替代

**all([]) == True** 参数为空iterable时返回True  
any([]) == False

syntatic sugar

类对象也是callable的

```
>>> class AT(object):
...     pass
... 
>>> callable(AT)
True
>>>
```
 
**当类被调用时，先调用__new__创建对象，然后调用__init__初始化对象。**

语言分类：

 - 过程式 顺序执行代码
 - 声明式 代码定义要解决的问题是什么，由语言自身决定改怎么做，典型的声明式语言是SQL
 - 面向对象式 程序只操作一系列对象，没有其他内容，典型的是Java和Smalltalk
 - 函数式 程序通过一系列函数解决问题，典型的是Haskell

Python中iterator的定义只是“拥有\_\_next\_\_()方法”，iterator只能持续查找下一个元素，无法回退，也不能被重置。  
虽然有些类可以实现重置iterator等功能，但并不包括在iterator定义中。正常情况下，如果想要使用之前的元素，需要重新创建相同的iterator

generator在yield时保存函数内部的变量和状态，在下次调用函数时，以前次结束的状态为起始状态  
可以通过generator.send方法给generator内部传值，该值将作为yield指令的返回值

```
def iter1():
    i = 0
    while 1:
        val = (yield i)  # 单行yield赋值命令最好用括号围起来
        if val is not None:
            i = val
        else:
            i += 1
>>> t1 = iter1()
>>> next(t1)
0
>>> next(t1)
1
>>> next(t1)
2
>>> t1.send("b")  # 函数内部的val被赋值为"b"
'b'
>>> t1.next()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 8, in iter1
TypeError: cannot concatenate 'str' and 'int' objects  # string类型不能直接相加
```

函数中的`__dict__`用于存储被赋给函数的属性值

*keyword-only arguments* 只传给函数kwargs

函数的`__default__`属性保存参数默认值  
keyword-only参数的默认值保存在`__kwdefaults__`  
参数名等保存在`__code__`属性，`__code__`属性是包含自身很多属性的code对象
`__code__.co_varnames` 保存参数名  
`__code__.co_argcount` 保存参数个数，不包括`*`和`**`指定的参数

inspect模块可以查看函数的参数定义和默认值设置  
inspect.signature

#####Function annotation 类型注释
函数的类型注释保存在`__annotations__`属性中，但是编译器不会对这些属性做处理

```
def clip(text:str, max_len:'int > 0'=80) -> str:
    ....
```

声明时使用'->'定义函数返回值类型

```
>>> sig = inspect.signature(clip)
>>> sig.return_annotation
<class 'str'>
>>> for param in sig.parameters.values():
...     note = repr(param.annotation).ljust(13)
...     print(note, ':', param.name, '=', param.default)
... 
<class 'str'> : text = <class 'inspect._empty'>
'int > 0'     : max_len = 80
>>> 
```

目前主要用于IDE上的类型检查


*operator.itemgetter* 返回获取数组指定元素的函数，类似lambda li: li[1: 2+1]，如果itemgetter设置的下标参数有多个，则返回数组  
*operator.attrgetter* 返回获取对象指定属性的函数，可以使用“.”方法获取的属性，都可以使用attrgetter获取  
以上两个方法也可用于指定sort函数的key函数
*operator.methodcaller* 通过函数名调用函数，只适用于当前作用域，也可传入参数，返回被调用的函数对象，使用已定义的参数定义函数

```
>>> from operator import methodcaller
>>> low_er = methodcaller('lower')
>>> low_er(l1[5])
'f'
>>> sub = methodcaller('replace', 'F', 'Oh no F please!')
>>> sub(l1[4])
'E'
>>> sub(l1[5])
'Oh no F please!'
>>> 
```

functools.partial 类似methodcaller，返回指定函数名的函数，但是定义函数时可以只传递部分参数
与methodcller的不同之处还有partial的第一个参数需要是可调用的函数对象，methodcaller只需要函数名

```
>>> from functools import partial
>>> sub_1 = methodcaller('replace', 'G')
>>> sub_1(l1[6], "Ah, it's the number.")
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: methodcaller expected 1 arguments, got 2
>>> 
>>> sub_2 = partial(str.replace, 'G')
>>> sub_2(l1[5], "Ah, it's the number.")
'G'
>>> sub_2(l1[6], "Ah, it's the number.")
"Ah, it's the number."
>>> sub_2(l1[7])
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: replace() takes at least 2 arguments (1 given)
>>> 
```

Python中，lambda表达式的内容被限制在“单个声明语句”，而partial返回的函数则没有这种限制。  
另外，相对而言，lambda表达式可能会在函数内部引用外部变量，从而改变外部变量，partial使用的独立的函数这方面的可能性较小


构造不可变的对象时，可以考虑不使用类定义，而使用namedtuple

**first-class function**  Function is the first class object in Python.

#####Decorators
装饰器可以将一个函数替换成另一个完全不同的函数
在模块被加载(import time)时，装饰器就被执行了(区别于函数被显式调用时的"run time")
通常，装饰器的使用有以下特点:
 - 正式的装饰器通常是在某个模块里定义，在另外的模块里被使用
 - 通常，装饰器不会反悔被修饰的函数，而是返回定义好的内部函数(由于装饰器在import time就被执行，因此返回内部函数便于实现在被修饰函数被调用时执行逻辑)

当被装饰器修饰的函数执行时，并不会执行原装饰器函数内部，内部函数以外部分的逻辑

```
>>> def decorator1(func):
...     print("decorator1 executing...")
...     def inner(*args):
...         print("inner function executing:")
...         print("{}".format(args))
...         print("execute argument function with inner's arguments")
...         func(*args)
...         print("----------")
...         print("inner function end.")
...     return inner
... 
>>> @decorator1
... def test1(*args):
...     print("test1 execute.")
...     print("test1 arugments: {}".format(args))
...     print("test1 end.")
... 
decorator1 executing...
>>> 
>>> test1
<function inner at 0x108054de8>
>>> test1(1,2,3)
inner function executing:
(1, 2, 3)
execute argument function with inner's arguments
test1 execute.
test1 arugments: (1, 2, 3)
test1 end.
----------
inner function end.
>>> 
```

在Python的函数体中，没有被声明的变量会被视为全局变量，从globals中寻找同名的变量
但是如果一个变量在函数体中被声明，却在声明之前被调用，编译器仍会将该变量视为函数内部变量，会在调用的地方报出变量在声明之前被引用的错误，不会查找全局范围
这是可使用global关键字，声明该变量为全局变量

```
def f2(a):
    print(a)
    print(b)  # 此时b被视为局部变量，不会向globals查询
    b = 6

def f3(a):
    global b
    print(a)
    print(b)
    b = 9
```

Immutable types: numbers, strings, tuples


```
import time
import functools


def clock(func):
    @functools.wraps(func)
    def clocked(*args, **kwargs):
        t0 = time.time()
        result = func(*args, **kwargs)
        t1 = time.time() - t0
        argvs = []
        if args:
            argvs.extend([str(e) for e in args])
        if kwargs:
            for k, v in kwargs.items():
                argvs.append("{}={}".format(k, v))
        print("[{:.08f}] {}({}) -> {}".format(float(t1), func.__name__, ", ".join(argvs), result))
        return result
    return clocked


@clock
def factorial(num):
    return 1 if num < 2 else num * factorial(num - 1)


if __name__ == "__main__":
    factorial(4)
```

被装饰器修饰的函数内部有递归调用时，会重复调用装饰器返回的内部函数

```
>>> factorial(4)
[0.00000191] factorial(1) -> 1
[0.00003791] factorial(2) -> 2
[0.00004983] factorial(3) -> 6
[0.00006199] factorial(4) -> 24
24
>>> 
```

注意：str.join(list)时，list内的所有元素都必须是**字符串**，否则会在拼接时报类型错误

*closure* 允许使用定义在函数作用域外的变量的函数
只有当函数是被定义在另一个函数内部时，才需要处理non-global的外部变量

**functools.wraps**
用于定义性能良好的装饰器

**functools.lru_cache**
*LRU* Latest Recently Used
根据*args、**kwargs保存最近一次的计算结果，如果参数相同，则直接返回结果，不重新执行函数

```
# 接上文的clock装饰器
# 返回斐波那契数列中的第n个数
@clock
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-2) + fibonacci(n-1)

>>> fibonacci(4)
[0.00000119] fibonacci(0) -> 0
[0.00000501] fibonacci(1) -> 1
[0.00153494] fibonacci(2) -> 1
[0.00000095] fibonacci(1) -> 1
[0.00000095] fibonacci(0) -> 0
[0.00000095] fibonacci(1) -> 1
[0.00003505] fibonacci(2) -> 1
[0.00007010] fibonacci(3) -> 2
[0.00164700] fibonacci(4) -> 3
3

>>> fibonacci(4)
[0.00000191] fibonacci(0) -> 0
[0.00000095] fibonacci(1) -> 1
[0.00009012] fibonacci(2) -> 1
[0.00000191] fibonacci(3) -> 2
[0.00012517] fibonacci(4) -> 3
3
>>> fibonacci(8)  # 联系两次调用，中间结果被保存，因此从上次结果开始
[0.00000286] fibonacci(5) -> 5
[0.00008202] fibonacci(6) -> 8
[0.00000215] fibonacci(7) -> 13
[0.00012612] fibonacci(8) -> 21
21
```

lru_cache的两个参数

 - **maxsize** 默认值128，lru_cache能保存的调用结果最大个数，如果是None，则无限制
 - **typed** 默认值False，是否按类型存储参数，设为True时，1和1.0(int与float)等将会分别存储

**functools.singledispatch**
将被装饰的函数变成装饰器，根据该返回装饰器装饰其他函数时设置的第一个参数类型的不同，调用不同的被装饰函数  
即使这时被装饰的函数是同名函数也没关系，只要register方法的参数是不同类型的就可以

类似Java中根据参数类型不同而实现的多态

```
from functools import singledispatch
from collections import abc
import numbers
import html

@singledispatch
def htmlize(obj):
    content = html.escape(repr(obj))
    return "<pre>{}</pre>".format(content)

@htmlize.register(str)
def _(text):
    content = html.escape(text).replace("\n", "<br>\n")
    return "<p>{}</p>".format(content)

@htmlize.register(numbers.Integral)
def _(n):
    return "<pre>{0} (0x{0:x})</pre>".format(n)

@htmlize.register(tuple)
@htmlize.register(abc.MutableSequence)  # 使用numbers.Integral、abc.MutableSequence这样的ABC，而非int、list，以兼容更多的对象类型
def _(seq):
    inner = "</li>\n<li>".join(htmlize(item) for item in seq)
    return "<ul>\n<li>" + inner + "</li>\n</ul>"

>>> htmlize(6)
'<pre>6 (0x6)</pre>'
>>> htmlize(90)
'<pre>90 (0x5a)</pre>'
>>> htmlize("hahaha")
'<p>hahaha</p>'
>>> htmlize({"A": "hahaha"})
'<pre>{&#x27;A&#x27;: &#x27;hahaha&#x27;}</pre>'
>>> htmlize([1, (2, '4'), ord])
'<ul>\n<li><pre>1 (0x1)</pre></li>\n<li><ul>\n<li><pre>2 (0x2)</pre></li>\n<li><p>4</p></li>\n</ul></li>\n<li><pre>&lt;built-in function ord&gt;</pre></li>\n</ul>'
>>> htmlize(clock)  # 参数类型是未注册的类型时，使用默认函数处理
'<pre>&lt;function clock at 0x102056f28&gt;</pre>'
>>> 
```

使用*numbers.Integral、abc.MutableSequence*这样的ABC，而非int、list这样具体的类，以兼容更多的对象类型

Stacked Decorators
205

带参数的装饰器，通常是在一般装饰器的基础上再嵌套一层函数

```
registry = set()
def register(active=True):
    def decorate(func):
        print("running register(active=%s)->decorate(%s)" % (active, func))
        if active:
            registry.add(func)
        else:
            registry.discard(func)
        return func
    return decorate

@register(active=False)  # set只在函数定义时被执行了一次
def f1():
    print("running f1()")

@register()
def f2():
    print("running f2()")

def f3():
    print("running f3()")
```

@方式使用装饰器，装饰器代码只会在第一次被使用时执行，而decorator(f)的方式，decorator的代码会在每次被使用时都执行

装饰器是在`__call__`方法中实装了被装饰方法的类
装饰器提供了类继承以外的另外一种实现动态的功能扩展的方法

```
import time

DEFAULT_FMT = '[{elapsed:0.8f}s] {name}({args}) -> {result}'

def clock(fmt=DEFAULT_FMT):
    def decorate(func):
        def clocked(*_args):
            t0 = time.time()
            _result = func(*_args)
            elapsed = time.time() - t0
            name = func.__name__
            args = ", ".join(repr(e) for e in _args)
            result = repr(_result)
            print(fmt.format(**locals()))
            return _result
        return clocked
    return decorate

@clock()
def snooze(seconds):
    time.sleep(seconds)

for i in range(3):
    snooze(.123)

[0.12566090s] snooze(0.123) -> None
[0.12547016s] snooze(0.123) -> None
[0.12578201s] snooze(0.123) -> None
>>>

@clock('{name}: {elapsed}s')  # 在装饰器中定义输出样式
def snooze(seconds):
    time.sleep(seconds)

for i in range(3):
    snooze(.123)

snooze: 0.1254880428314209s  # 另一种输出格式
snooze: 0.12515783309936523s
snooze: 0.1274111270904541s
>>> 

@clock("{name}({args}) dt={elapsed:.3f}s")
def snooze(seconds):
    time.sleep(seconds)

for i in range(3):
    snooze(.123)

snooze(0.123) dt=0.123s
snooze(0.123) dt=0.127s
snooze(0.123) dt=0.124s
>>> 
```

**nonlocal** 声明函数中的某个变量为非局部变量

variables are labels rather than boxes that store values  
Python的变量都是类似Java中的引用变量的概念，给变量赋值时，与其说是把对象a赋给了变量s，不如说是把变量s关联到了对象a

变量赋值语句总是先执行等号右边的代码，创建对象，然后再将左侧的变量名关联到已经创建的对象  
如果在赋值语句中等号右侧创建对象时出错，则赋值语句会被中断，左侧的变量名也不会被关联到新的对象

对象的id视Python编译器的不同而有不同的实现方式，在CPython中，id()直接返回对象在内存中的地址，其他编译器有其他的生成id的方式  
id在对象被创建时生成，而且在对象的生命周期中保持不变

tuple不可变的特性仅保持在内部结构层面，对于被引用的对象本身则没有限制(tuple内部的可变元素，值仍然是可以改变的)

Python中默认的copy都是浅copy

```
>>> l1 = [1,2,3, (4,5), [6,7]]
>>> l2 = list(l1)
>>> id(l1) == id(l2)
False
>>> id(l1[-1]) == id(l2[-1])
True
>>> l1[-1] is l2[-1]
True
>>> [l1[i] is l2[i] for i in range(len(l1))]
[True, True, True, True, True]
>>> 
```
虽然外层对象的id不同，但是内部元素引用的都是相同的对象


```
l1 = [3, [66, 55, 44], (7, 8, 9)]
l2 = list(l1)
l1.append(100)  # l1是独立的list对象，直接改变l1不会影响另外创建的l2
l1[1].remove(55)  # 改变l1内部的元素对象，会影响同样引用该对象的l2
print('l1:', l1)  # 此时l1比l2多一个元素100
print('l2:', l2)
l2[1] += [33, 22]  # 改变可变元素对象，直接改变原对象的值
l2[2] += (10, 11)  # 改变不可变元素对象，会生成新的元素对象
print('l1:', l1)  # 此时l1[-1]和l2[-1]已不是同一个对象
print('l2:', l2)
```

[Python代码对象引用可视化](http://www.pythontutor.com/live.html#mode=edit)

对象深层copy会复制对象内部包含的对象，即使对象之间存在循环引用，也会原样复制  
但是深层copy也可能会复制一些单例对象，这时就与设计初衷相违了，需要注意

Python中函数的参数值传递，实际上是在执行函数时，把形参变量名绑定到实参所指向的对象上，形参与实参使用的是同一个对象  
因此如果参数是可变的对象，那么在函数中对可变对象做出的改动，会直接反映到外部的实参上  
而如果参数是不可变对象，那么对参数的改动会生成新的对象，也就不会影响外部的实参指向的对象

```
def f1(a, b):
    a += b
    return a

>>> a, b = 1, 2
>>> f1(a, b)
3
>>> a, b  # a, b值不变
(1, 2)
>>> 
>>> a, b = [1], [2]
>>> f1(a, b)
[1, 2]
>>> a, b  # a的值变成了函数内被赋予的值
([1, 2], [2])
>>> 
>>> a, b = (1,), (2,)  # 只有一个元素时注意逗号
>>> f1(a, b)
(1, 2)
>>> a, b
((1,), (2,)) # a，b的值不变
>>>
```

**不要使用可变对象作为函数的默认值**
Python函数的参数默认值，在函数被加载时被编译，然后保存在`func_name.__init__`中  
如果函数参数的默认值是可变对象，那么多次执行函数时，引用的默认值都会是保存在`func_name.__init__`中的同一个可变对象，这样函数调用之间会产生相互影响

向参数中传递可变参数时，为了防止影响外部实参的值，最好在接受参数时，对形参赋给参数的拷贝

234 del and garbage collection

