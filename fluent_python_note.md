
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

#####\_\_del\_\_
\_\_del\_\_的用法很特别，一般不需要重写
标准库函数del并不是直接删除变量所指向的对象，而是通过删除变量，使得当被指向的对象的被引用计数为0时，而被Python编译器删除

`weakref.finalize(object1, func1)`  注册func1在object1所指向的对象被gc时执行

`weakref.WeakValueDictionary` 用法类似普通字典，区别在于返回的对象中，值是对象的弱引用，不占用引用计数，
如果被引用的对象由于没有其他被引用而被删除，该字典中对应的key也会被自动删除

```
>>> stock = weakref.WeakValueDictionary()
>>> class Cheese:
...     def __init__(self, kind):
...         self.kind = kind
...     def __repr__(self):
...         return "Cheese(%r)" % self.kind
... 
>>> catalog = [Cheese('Red Leicester'), Cheese('Tilsit'), Cheese(]
  File "<stdin>", line 1
    catalog = [Cheese('Red Leicester'), Cheese('Tilsit'), Cheese(]
                                                                 ^
SyntaxError: invalid syntax
>>> catalog = [Cheese('Red Leicester'), Cheese('Tilsit'), Cheese('Brie'), Cheese('Parmesan')]
>>> for cheese in catalog:
...     stock[cheese.kind] = cheese
... 
>>> sorted(stock.keys())
['Brie', 'Parmesan', 'Red Leicester', 'Tilsit']
>>> del catalog
>>> sorted(stock.keys())  # for循环的临时变量在循环结束后仍然存在
['Parmesan']
>>> del cheese  # 删除所有强引用后，WeakValueDictionary中的键值都被清空
>>> sorted(stock.keys())
[]
>>> 
```

`weakref.WeakKeyDictionary`  可用于向外部对象添加额外的值而不增加额外的属性  
`weakref.WeakSet`  当内部所有值所指向的对象被gc后，set也被清空

**弱引用可以处理的对象种类非常有限**

 - 基础的list和dict类实例都不能作为若引用的被引用对象，但是它们的子类可以
 - set的实例对象可以作为被若引用的对象
 - int和tuple类，不管是基础类还是子类的对象，都不能被若引用

以上限制的原因，主要是由于基础类CPython实现的问题，而如果使用其他Python编译器，可能不会有这样的问题

#####Python对不可变对象的特殊处理
str、bytes、tuple和frozenset的`str(str1)`和`str1[:]`(forzenset的是fs.copy())操作，返回的都是被引用的同一个对象

```
>>> str1 = "foryourowngood"
>>> str2 = str1[:]
>>> str3 = str(str1)
>>> str1 is str2  # 与原变量指向相同的对象
True
>>> str1 is str3  # str3指向同一个str实例对象
True
>>> 
```

对于频繁被使用的int(如-1, 0或者42)和str实例，Python编译器会缓存实例对象以优化运行速度

```
>>> t1 = (1,2,3)
>>> t2 = (1,2,3)
>>> t1 is t2  # 值相同但不是同一个对象
False
>>> s1 = "123"
>>> s2 = "123"
>>> s1 is s2  # 赋值两次，使用的是同一个string对象
True
>>> n1 = 456
>>> n2 = 456
>>> n1 is n2  # 较大数字，未使用同一对象
False
>>> n1 = 0
>>> n2 = 0
>>> n1 is n2  # 较小的数字则使用同一对象做赋值操作
True
>>> n1 = 30
>>> n2 = 30 
>>> n1 is n2
True
>>>
```

每个Python对象都有一个标识符、类型和值，三者中只有值是可变的

Python的变量都是指向对象的引用这一特性，使Python具有以下特性：

 - 单纯的赋值不会产生新的对象实例拷贝
 - 对于自增运算，`+=`、`*=`等，如果左边的操作符是不可变对象，那么会创建新的对象；而如果是可变对象，那么会直接改变原对象(*change in-place*)
 - 为一个对象赋新值不会改变该变量原本指向的对象的值；这个操作也可以叫做重新绑定(rebinding)，变量被改为指向另一个对象。而如果一个对象的被引用数减少到0，就会被gc
 - 函数参数变量传递的也是引用，因此如果参数变量指向的是可变对象，那么函数内操作该对象，函数外部指向该对象的变量同样会被改变。除非使用不可变对象
 - 使用可变对象作为函数的默认参数，可能会有参数所指向对象的*in-place change*，从而影响后续对该函数的每一次调用

#####垃圾回收机制 GC
Python的GC主要采用引用计数的方式  
但是对于两个变量循环引用的情况，引用计数并不能很好的解决，可能产生内存泄露。因此又引入了分代式垃圾回收(generational garbage collection)  
不过，引用计数仍然是对象gc的重要指标，如果一个对象的被引用数是0，那么会立即被回收

不同的Python内核版本使用的gc机制不尽相同，CPython主要是引用计数方式，Jython和Iron Python使用的是各自对应的gc机制  
PyPy会在从前一次GC结束开始，使用内存增加了的82%的时候触发一次完整的gc，也只有在一次完整的gc中，对象的\_\_del\_\_方法才会被调用  
因此在实际运行程序时，PyPy触发gc的时机不太容易确定

Pyhton的函数参数传递方式：call by sharing

在Python中，没办法直接删除一个对象，只能通过删除该对象的所有引用的方式，使gc删除对象

Python3字符串显示的内部方法除了`__repr__`和`__str__`之外，还有`__bytes__`(调用bytes()时返回的bytes字符串)和`__format__`(format()和str.format()方法使用的内部函数)

`format(str1, format_spec)`  
`str1.format(format_spec)`

hash操作一般可以是对属性的hash值进行按位异或

```
def __hash__(self):
    return hash(self.x) ^ hash(self.y)
```

在类方法的内部，可以通过`type(self).__name__`获取类自身的名字，只有Python3适用  
用户自定义类中，实装了`__iter__`方法后，可以在参数赋值、多重赋值等场合使用语法糖的简便方式


#####@classmethod和@staticmethod
被@classmethod修饰的类内方法，第一个参数不是self，而是cls，类对象自身  
相比于普通的类方法的第一个参数是self，处理的对象是实例对象，被@classmethod修饰的类方法处理的对象是类对象

被@staticmethod修饰的类内方法，不需要限制必须将第一个参数设置为self或者cls  
定义方式和普通的函数相同，使用方式也相同

如果需要在类内定义无法被改变的属性，可以使用@propety装饰器定义属性的get方法  
通过该装饰器定义的类方法可以使用类似调用类属性的a.b方式调用，但是不能以这种方式被赋值，即`a.b = c`的赋值语句会报错

Python中没有强制性的不允许改变的"protected"变量  
但是约定俗成，以双下划线开头的变量都是类内的私有变量，不允许被改变，因为改变这些变量可能影响类内其他代码的运行  
所有的类内变量都被存储在实例的\_\_dict\_\_属性中，该属性是一个字典  
如果累内变量名是双下划线开头的，那么在\_\_dict\_\_字典中，对应的键名以"_类名变量名"的形式构成  
可以通过直接给该变量赋值的方式给实例的变量赋值 
但是不推荐使用这样的赋值方式

```
class AA(object):
    def __init__(self, a1, a2):
        self.a1 = a1
        self.a2 = a2
        self.__sum = str(a1) + str(a2)
        self._sum1 = self.__sum
        self.sum2_ = self.__sum
        self.sum3__ = self.__sum

aa = AA(1, [2,3,4])
>>> aa.__dict__
{'sum2_': '1[2, 3, 4]', '_sum1': '1[2, 3, 4]', 'sum3__': '1[2, 3, 4]', 'a1': 1, 'a2': [2, 3, 4], '_AA__sum': '1[2, 3, 4]'}

>>> for k, v in aa.__dict__.items():
...     print("{}: {}".format(k, v))
... 
sum2_: 1[2, 3, 4]
_sum1: 1[2, 3, 4]
sum3__: 1[2, 3, 4]
a1: 1
a2: [2, 3, 4]
_AA__sum: 1[2, 3, 4]
>>> aa.__dict__['sum2_'] = "ASX"  # 直接赋值改变实例变量的值
>>> aa.sum2_
'ASX'
>>> dir(aa)  # 类内以双下划线开头的变量，变量名已被改变后存储
['_AA__sum', '__class__', '__delattr__', '__dict__', '__doc__', '__format__', '__getattribute__', '__hash__', '__init__', '__module__', '__new__', '__reduce__', '__reduce_ex__', '__repr__', '__setattr__', '__sizeof__', '__str__', '__subclasshook__', '__weakref__', '_sum1', 'a1', 'a2', 'sum2_', 'sum3__']
>>> 

```

Python的这种处理双下划线开头的内部变量的convention，被称为*name mangling*  
这种方式没有强制效果，只是一种约定俗成的安全措施，并不能保证完全安全  
(Name magling is about safety, not security.)


####\_\_slots\_\_
默认情况下，类的实例变量被存放在对象的\_\_dict\_\_字典中，会占用多余的空间
可以使用\_\_slots\_\_定义实例变量，将变量存储在元组中，减少内存占用  
\_\_slots\_\_定义的类属性不会被子类继承，子类如果需要减少实例内存消耗，需要重新定义__slots__属性
使用方法：在类定义中定义\_\_slots\_\_属性，值为类内使用的所有类属性名序列  
如果类内存在未在\_\_slots\_\_中定义的属性，那么会在初始化时出错


```
>>> class AA(object):
...     __slots__ = ('a1', 'b1')  # 未声明属性a2
...     def __init__(self, a1, a2, b1):
...         self.a1 = a1
...         self.a2 = a2
...         self.b1 = b1
... 
>>> a1 = AA(1, '4fd', ['324', 13])
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 5, in __init__
AttributeError: 'AA' object has no attribute 'a2'  # 出错，为定义a2属性
>>> class AA(object):
...     __slots__ = ('a1', 'b1')
...     def __init__(self, a1, b1):
...         self.a1 = a1
...         self.b1 = b1
... 
>>> a1 = AA(1, 2)  # __slots__中包括所有属性，正常实例化
>>> dir(a1)
['__class__', '__delattr__', '__doc__', '__format__', '__getattribute__', '__hash__', '__init__', '__module__', '__new__', '__reduce__', '__reduce_ex__', '__repr__', '__setattr__', '__sizeof__', '__slots__', '__str__', '__subclasshook__', 'a1', 'b1']
>>> a1.__dict__  # AA的实例对象中，没有__dict__属性
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'AA' object has no attribute '__dict__'
>>> a1.__slots__
('a1', 'b1')
>>> 
```

如果实例对象需要时若引用的目标对象，则需要将\_\_weakref\_\_也加入\_\_slots\_\_中

#####\_\_slots\_\_的限制

 - 每个子类中都需要重新定义\_\_slots\_\_，编译器不会为子类使用父类的\_\_slots\_\_定义
 - 实例只会具有\_\_slots\_\_中定义的属性，除非在\_\_slots\_\_中定义了\_\_dict\_\_，但是那又会与节约内存的初衷相违
 - 必须要在\_\_slots\_\_中加入\_\_weakref\_\_才能让实例可以作为若引用的目标对象

如果没有明确的内存性能要求，最好不使用\_\_slots\_\_

类变量可以被重新赋值，要注意的是，如果通过类名赋值类变量，`AA.a1 = "SS"`，那么后续所有未显式给该类变量赋值的实例中该变量的值也会改变  
如果通过实例给类变量赋值，`aa.a1 = "SS"`，则只影响该实例

*To build Pythonic objects, observe how real Python objects behave.*
知己知彼，百战不殆。

> In Java too, access control modifiers are mostly about safety and not security, at least in practice.

repr库(py2)或者reprlib库(py3)里的repr方法，可以在要显示的iterable过长(元素个数超过6个)时，省略显示

```
import sys
if sys.version.startswith("2."):
    from repr import repr
else:
    from reprlib import repr

>>> repr(list(range(10)))
'[0, 1, 2, 3, 4, 5, ...]'
>>> repr(list(range(6)))  # 元素个数未超过6个时，不使用"..."省略显示
'[0, 1, 2, 3, 4, 5]'
>>> repr(list(range(7)))
'[0, 1, 2, 3, 4, 5, ...]'
>>> 
```

实际运行中repr与debug输出有关，因此最好可以保证在repr方法中有适当的错误处理逻辑

#####Protocols and duck typing

protocol 实装对应的`__`开头的私有方法，可以在对象上使用对应的操作


iterable对象的切片语法会传给`__getitem__`对象一个slice对象，内容是slice(start, end, step)
为一个自定义类实装切片方法：

```
def __getitem__(self, index):
    cls = type(self)
    if isinstance(index, slice):
        return cls(self._components[index])  # 返回新的Vector实例对象，使用指定的原内容切片初始化
    elif isinstance(index, numbers.Integral):  # 使用ABC代替具体类，扩展可用范围
        return self._components[index]  # 直接返回指定位置的内容，返回对象不是Vector实例
    else:
        msg = '{cls.__name__} indices must be integers'
        raise TypeError(msg.formats(cls=cls))
```

对象查询属性的顺序是：实例对象 => 类对象 => 父类对象 => `__getattr__(obj1, attr1)`
只有在实例对象、类对象和父类对象中都找不到指定的对象时，才会调用`__getattr__`方法
通过`__getattr__`方法返回属性的操作，会给实例对象添加该属性，在赋值时需要注意

```
class T:
    def __init__(self, attr1, attr2):
        self.attr1 = attr1
        self.attr2 = attr2
    def __getattr__(self, attr_nm):
        cls = type(self)
        if len(attr_nm) == 1 and isinstance(attr_nm, str):
            return "Customize attr {}".format(attr_nm)
        msg = "{.__name__!r} object has no attribute {!r}"
        raise AttributeError(msg.format(cls, attr_nm))

>>> t1 = T('123', "AEF")
>>> dir(t1)  # 初始属性
['__doc__', '__getattr__', '__init__', '__module__', 'attr1', 'attr2']
>>> t1.k  # 取设定之外的属性，触发__getattr__
'Customize attr k'
>>> dir(t1)  # 此时实例对象属性不变
['__doc__', '__getattr__', '__init__', '__module__', 'attr1', 'attr2']
>>> t1.k = 123  # 给设定之外的属性赋值
>>> dir(t1)  # 实例对象中产生了额外的属性
['__doc__', '__getattr__', '__init__', '__module__', 'attr1', 'attr2', 'k']
>>> 
```

为了防止这种情况，最好的办法是使用`__setattr__`方法，防止赋值操作影响实例对象

```
class T:
    def __init__(self, attr1, attr2):
        self.attr1 = attr1
        self.attr2 = attr2
    def __getattr__(self, attr_nm):
        cls = type(self)
        if len(attr_nm) == 1 and isinstance(attr_nm, str):
            return "Customize attr {}".format(attr_nm)
        msg = "{.__name__!r} object has no attribute {!r}"
        raise AttributeError(msg.format(cls, attr_nm))
    def __setattr__(self, name, value):
        cls = type(self)
        if len(name) == 1 and isinstance(name, str):
            error = "readonly attribute {name!r}"
        else:
            error = ''
        if error:
            raise AttributeError(error.format(name=name))
        super().__setattr__(name, value)  # 该写法仅适用于Python3

>>> t1 = T('123', 'KUK')
>>> t1.k
'Customize attr k'
>>> t1.k = 123  # 赋值时出错
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 18, in __setattr__
AttributeError: readonly attribute 'k'
>>> 
```

**通常，在需要使用`__getattr__`的场合，设置属性的`__setattr__`也需要使用**

functools.reduce  
`reduce(func, iterable, initializer)`  
initializer 初始值通常是0或1

比较iterable对象时使用zip构建generator节约内存

```
def __eq__(self, other):
    if len(self) != len(other):  # 前置条件判断，也可以防止zip函数截断二者中较长的
        return False
    for a, b in zip(self, other):  # 使用zip构造生成器，遍历self和other
        if a != b:
            return False
    return True

```

使用all的简化版本  
all函数会在检查到False时自动停止遍历并返回，因此效率与上面的写法相类

```
def __eq__(self, other):
    return len(self) == len(other) and all(a == b for a, b in zip(self, other))
```

zip 源自zipper，拉链
zip可以合并任意数量的iterable，组成按元素下标划分的元祖  
需要注意的是zip函数会在到达最短的参数iterable的末尾时停止，即使其他iterable仍有元素，也不会继续遍历，也不会出错  
这一点必须与多重赋值时，等号左右两边的长度不相等而出错报出ValueError的处理方式相区分

使用zip_longest可以遍历到最长的iterable结束，可以通过参数fillvalue控制长度不够的iterable使用什么值补位，fillvalue的默认值是None

```
>>> from itertools import zip_longest
>>> list(zip(range(6), "ABC"))  # 自动截止于最短参数长度
[(0, 'A'), (1, 'B'), (2, 'C')]
>>> list(zip_longest(range(6), "ABC"))  # 会遍历到最长的参数长度，超过的补None
[(0, 'A'), (1, 'B'), (2, 'C'), (3, None), (4, None), (5, None)]
>>> list(zip_longest(range(4), "ASDFGHHHH", "zxcvb", fillvalue='Nonono'))  # 指定补位使用的值
[(0, 'A', 'z'), (1, 'S', 'x'), (2, 'D', 'c'), (3, 'F', 'v'), ('Nonono', 'G', 'b'), ('Nonono', 'H', 'Nonono'), ('Nonono', 'H', 'Nonono'), ('Nonono', 'H', 'Nonono'), ('Nonono', 'H', 'Nonono')]
```

####protocol
my_seq[a:b:c]实装方式  
`__getattr__`单独实装是隐藏的bug  
`__hash__`的计算方式  
`__hash__`之于`__eq__`  
`__format__`自定义使用  
reprlib显示缩写的规则(超过指定长度之后使用省略号显示)  

######为什么使用高级语言
使用高级语言来保证代码具有更好的可读性，在底层如何实现的问题，应该交给语言编译器解决

ABCs、descriptors(装饰器)、metaclasses(元类)主要用于在框架实现中使用，具体业务中最好不要使用这些，以免产生无法调查的bug

#####protocols are interfaces
protocols不是正式的语法，因此不能像ABCs那样强制性定义对象的行为  
interface 可以视作部分或者全部对象方法为完成特定操作而划分的集合  
protocol不能被继承  
一个类可能会有几种不同的protocol，以使类的对象可以担当不同的角色

Python用语中，"X-like protocol", "X protocol", "X interface"所指代的意义相同

对于已经实装了`__getitem__`方法的类，它的对象可以像`__iter__`、`__contains__`方法那样使用for遍历元素，用in检查元素是否存在  
如果一个iterable对象需要支持random.shuffle，必需支持`__setitem__`方法

*Monkey patching*: changing a class or module at run time, without touching the source code  
Python不允许monkey patching标准类型(built-in types)

*duck typing*: operating with objects regardless of their types, as long as they implement certain protocols.

numbers, collections.abc 基础的抽象类的集合

```
>>> [e for e in dir(collections.abc) if not e.startswith("__")]
['AsyncIterable', 'AsyncIterator', 'Awaitable', 'ByteString', 'Callable', 'Container', 'Coroutine', 'Generator', 'Hashable', 'ItemsView', 'Iterable', 'Iterator', 'KeysView', 'Mapping', 'MappingView', 'MutableMapping', 'MutableSequence', 'MutableSet', 'Sequence', 'Set', 'Sized', 'ValuesView']
>>> [e for e in dir(numbers) if not e.startswith("__")]
['ABCMeta', 'Complex', 'Integral', 'Number', 'Rational', 'Real', 'abstractmethod']
>>> 
```

对于抽象类，一个类即使不直接继承抽象类，只要实装了对应的方法，也可以算是抽象类的子类

```
>>> class A:
...     def __len__(self):
...         return 13
... 
>>> issubclass(A, collections.abc.Sized)
True
```

collections.abc.Sized的判断标准就是定义了`__len__`方法，而且返回值是大于0的常数，即大于0的固定长度

**goose typing** 相较于不使用isinstance、issubclass等判断继承的方法，只看已经实装了的protocol的duck typing，当需要判断类或者对象的父类是否抽象类时，支持使用isinstance/issubclass等函数

继承抽象类时，需要注意，抽象类中有些方法是已经实装了的，不需要在子类中重新定义，而有些抽象类并没有定义，需要在子类中定义

*MappingView* dict一类的对象的遍历方法会返回MappingView对象

方法 | 返回的view | 父类
:----- | :------ | :------
.items() | ItemsView | Set, MappingView
.keys() | KeysView | MappingView
.values() | ValuesView | Set, MappingView

numbers中的ABCs，Number, Complex, Real, Rational, Integer

decimal.Decimal没有被注册成ABC numbers.Real的子类，因为从实用的角度上看，当需要使用Decimal程度的精度时，如果出现了和更高精度数据的混合计算(特别是float)，可能会影响预期的精度


使用@abc.abstractmethod装饰器定义抽象方法，这个装饰器必须是被修饰方法的最内层装饰器，被修饰方法的def声明和@abc.abstractmethod之间不应该有任何代码

定义在抽象类中的方法，如果对外部的操作只使用类内已经实装的抽象方法，那也可以定义有具体操作的抽象方法--一般都会被子类重写

定义抽象类最常用的方法是直接继承abc.ABC或者其他的抽象类  
但是abc.ABC是在Python3.4版本才被引入的，之前的版本需要在定义类时指定`metaclass=abc.ABCMeta`才行


```
class Tombola(metaclass=abc.ABCMeta):
    ...

```

类定义中的metaclass关键字在Python3中被引入，Python2中没有，需要在类定义中指定`__metaclass__`属性


```
class Tombola(object):
    __metaclass__ = abc.ABCMeta
    ...

```

#####virtual subclass
通过使用register函数注册目标类，使目标类可以使用ABC的属性和方法，但是又和ABC没有继承关系

`__subclasses__()` 返回类的直接父类，不包括virtual class  
`_abc_registry` 返回该类注册的virtual class的弱引用，WeakSet，只对ABCs有效

`__subclasshook__` 在被issubclass检查时被调用，验证是否参数类的父类，只有ABC中定义了该方法才会被调用  
使用范围应限制在简单的根据某个标准判定

抽象类主要用于定义框架，便于不熟悉框架内核使用者在抽象类的基础上定义需要的子类    
抽象类的主要优点在于便捷的类型检查，继承抽象类会造成继承链上无处不在的类型检查，这与Python本身动态类型的语言特性(duck typing)不合，  
因此，相比在非必要的场合使用抽象类，不如考虑使用动态类型的特性

#####语言分类
######强类型语言与弱类型语言
几乎没有隐式类型转换的语言是强类型语言，隐式类型转换作为默认操作，常见于各种场景的，是弱类型语言
######静态语言与动态语言
在编译时进行类型检查的是静态语言，通常需要类型声明  
在运行是才进行类型检查的是动态语言

对于以上两种分类，一种语言可以分别是有两种特性

语言 | 强类型语言 | 弱类型语言 | 动态语言 | 静态语言
:--- | :--- | :--- | :--- | :---
Java | 是 | 否 | 否 | 是
C++ | 是 | 否 | 否 | 是
Python | 是 | 否 | 是 | 否
PHP | 否 | 是 | 不明 | 不明
JavaScript | 否 | 是 | 是 | 否
Perl | 否 | 是 | 不明 | 不明
Fortran | 不明 | 不明 | 否 | 是
Lisp | 不明 | 不明 | 是 | 否


###Inheritance 继承
直接继承dict、list等由CPython实现的内部类，使用时可能出现子类方法无法覆盖父类方法的情况  
最好使用专门为用户自定义类型提供的类作为父类，保证子类方法的正常运行

内部类 | Python2 用户类的父类 | Python3 用户类的父类
:---- | :-------- | :--------
dict | UserDict.UserDict | collections.UserDict
list | UserList.UserList | collections.UserList
str | UserString.UserString | collections.UserString

#####MRO
Method Resolution Order

Python2 版本

```
class A(object):  # 必须是新式类，否则无法使用super访问
    def ping(self):
        print("ping: ", self)

class B(A):
    def pong(self):
        print("pong: ", self)

class C(A):
    def pong(self):
        print("PONG: ", self)

class D(B, C):
    def ping(self):
        super(D, self).ping()
        print("post-ping: ", self)
    def pingpong(self):
        self.ping()
        super(D, self).ping()
        self.pong()
        super(D, self).pong()
        C.pong(self)
```

Python3 版本

```
class A:
    def ping(self):
        print("ping: ", self)

class B(A):
    def pong(self):
        print("pong: ", self)

class C(A):
    def pong(self):
        print("PONG: ", self)

class D(B, C):
    def ping(self):
        super().ping()
        print("post-ping: ", self)
    def pingpong(self):
        self.ping()
        super().ping()
        self.pong()
        super().pong()
        C.pong(self)
```

执行结果

```
>>> d = D()
>>> d.ping()
('ping: ', <__main__.D object at 0x10e300350>)  # super.ping执行A.ping
('post-ping: ', <__main__.D object at 0x10e300350>)  # 自定义ping逻辑
>>> C.ping(d)  # unbound方式执行C.ping，注意需要传入实例作为参数
('ping: ', <__main__.D object at 0x10e300350>)
>>> d.pong()
('pong: ', <__main__.D object at 0x10e300350>)  # 默认执行B.pong
>>> C.pong(d)  # unbound方式执行C.pong，还是要传入实例做参数
('PONG: ', <__main__.D object at 0x10e300350>)
>>> d.pingpong()
('ping: ', <__main__.D object at 0x10e300350>)
('post-ping: ', <__main__.D object at 0x10e300350>)  # self.ping()输出
('ping: ', <__main__.D object at 0x10e300350>)  # A.ping
('pong: ', <__main__.D object at 0x10e300350>)  # B.pong
('pong: ', <__main__.D object at 0x10e300350>)  # super.pong，执行B.pong
('PONG: ', <__main__.D object at 0x10e300350>)  # unbound方式执行C.pong
>>> 
```

类的继承关系保存在`__mro__`中

```
>>> D.__mro__
(<class '__main__.D'>, <class '__main__.B'>, <class '__main__.C'>, <class '__main__.A'>, <class 'object'>)
>>>
```

在子类的实例运行父类方法时，会根据mro定义的顺序，从下向上沿着继承链寻找，`__mro__`中定义的父类位置靠前的会被优先使用  
如果要绕开mro的查询机制，可以直接使用`ClassName.arrt1`这样的unbound方式直接调用指定父类的方法，但是这样的方式可能会使继承这个类的子类无法访问这个类的父类，不是规范的做法

实际编码中，类定义里如果存在多重继承，写在前面的父类优先级会更高，即`class D(B, C):...`与`class D(C, B):...`两种写法， 父类B与C的优先级不同

#####多重继承并非完全不能使用
*aggregate class* 继承了几个类，但是自身不包含任何方法的类，仅仅作为几个类的合并接口而存在
*mixins* 抽象类中的具体方法  
与抽象类相近，多重继承也多用于创建框架，而不是用于实现具体的应用业务  
singledispatch  

旧式类的多重继承查找方式是从左到右，深度优先  
新式类使用的处理多重继承关系链的算法是**C3方法**，用于解析化简mro的继承关系

#####关于使用多重继承的几点建议
 1. Distinguish interface inheritance from implementation inheritance
  * interface inheritance  接口继承，创建了一种下属类型
  * implementation inheritance  类继承，减少重复代码
 2. Make interfaces explicit with ABCs  使用ABC定义interface
 3. Use mixins for code reuse  定义通用的具体方法，减少interface中的重复代码
 4. Make mixins explicit by naming  在具体方法名后加上Mixin，表名该方法是个mixin方法
 5. A ABC may also be a mixin; the reverse is not true  
 6. Don't subclass from more than one concrete clsss  多重继承关系中最好只使用一个具体的类，防止引用冲突
 7. Provide aggregate class to users  为用户提供aggregate class，在一个接口类中包含尽可能多的实现，便于使用
 8. Favor object composition over class inheritance  相比想方设法继承特性，不如修改结构，设计一个更好的类

有多重继承关系的子类，执行super().method时，会顺序执行所有父类中的同名方法


####运算符重载

Python中对于运算符重载的限制

 - 不能对内置类型使用运算符重载
 - 只能使用已有的运算符，不能自定义新的运算符
 - 部分运算符不能被重载: is、and、or、not (对应的位运算符：&、|、~可以被重载)

对于重载的单目运算符，不能直接修改传入的参数对象，必须返回修改后的新对象  
除了增量运算符，运算符本身不能改变参数对象

`zip_longest`

```
>>> from itertools import zip_longest
>>> list(zip_longest(range(10), list("adfssf"), fillvalue=4))
[(0, 'a'), (1, 'd'), (2, 'f'), (3, 's'), (4, 's'), (5, 'f'), (6, 4), (7, 4), (8, 4), (9, 4)]
>>> 
```

#####Python中基本运算符的调用顺序
以`a + b`为例  

 1. 如果a有`__add__`方法，则调用执行`a.__add__(b)`，如果执行结果不是*NotImplemented*，则返回结果
 2. 如果a没有`__add__`方法，或者该方法的执行结果返回*NotImplemented*，那么检查对象b是否有`__radd__`方法，
 如果有，则执行`b.__radd__(a)`，如果执行结果不是*NotImplemented*，则返回结果
 3. 如果对象b没有`__radd__`方法，或者`b.__radd__(a)`返回*NotImplemented*，那么返回*TypeError*和错误信息"unsupported operand types"

对应的减法也是一样，`__sub__`与`__rsub__`

*NotImplemented* 不是异常*NotImplementedError*，是一种运算符返回结果的类型，表示该运算符无法处理被指定的对象


**@** 3.5添加的矩阵点乘符号，对应的方法是`__matmul__`和`__rmatmul__`


#####计算运算符与内部方法的关系

运算符 | 正向(从左向右) | 反向(从右向左) | in-place | 说明
:----- | :----- | :----- | :----- | :-----
+ | `__add__` | `__radd__` | `__iadd__` | 加法或者连接
- | `__sub__` | `__rsub__` | `__isub__` | 减法
* | `__mul__` | `__rmul__` | `__imul__` | 乘法或者重复n个对象
/ | `__truediv__` | `__rtruediv__` | `__itruediv__` | 除法
// | `__floordiv__` | `__rfloordiv__` | `__ifloordiv__` | 向下取整
% | `__mod__` | `__rmod__` | `__imod__` | 取余
divmod() | `__divmod__` | `__rdivmod__` | `__idivmod__` | 返回除法结果的整数和余数组成的元组
**，pow() | `__pow__` | `__rpow__` | `__ipow__` | 指数乘方
@ | `__matmul__` | `__rmatmul__` | `__imatmul__` | 矩阵乘法，py3.5引入
& | `__and__` | `__rand__` | `__iand__` | 按位与
| | `__or__` | `__ror__` | `__ior__` | 按位或
^ | `__xor__` | `__rxor__` | `__ixor__` | 按位异或
<< | `__lshift__` | `__rlshift__` | | `__ilshift__` | 位左移
>> | `__rshift__` | `__rrshift__` | | `__irshift__` | 位右移


#####比较运算符  
object基础类提供了比较两个对象的id的`__ne__`方法

在Python2中，如果自定义了`__eq__`方法，那么还需要自定义`__ne__`方法。在Python3中则不需要重新定义`__ne__`

######运算逻辑

 1. 对于a == b，如果`a.__eq__(b)`返回NotImplemented，则调用`b.__eq__(a)`，同样的eq方法，返回比较结果。但如果是 a > b，那么在`a.__gt__(b)`返回NotImpelmented时，会交换操作数的位置，再调用相反的比较方法`b.__lt__(a)`
 2. ==和!=这样的相等性比较里，如果连反向方法都比较失败，Python会比较两个对象的id，而不是返回TypeError(Python2的表现，3里是直接返回TypeError)

运算符 | 正向(从左向右) | 反向(从右向左) | 兼容方案(fall back)
:----- | :----- | :----- | :-----
a == b | `a.__eq__(b)` | `b.__eq__(a)` | Python2 `return id(a) == id(b)`; Python3 `raise TypeError`
a != b | `a.__ne__(b)` | `b.__ne__(a)` | `return not (a == b)`
a > b | `a.__gt__(b)` | `b.__lt__(a)` | `raise TypeError`
a < b | `a.__lt__(b)` | `b.__gt__(a)` | `raise TypeError`
a >= b | `a.__ge__(b)` | `b.__le__(a)` | `raise TypeError`
a <= b | `a.__le__(b)` | `b.__ge__(a)` | `raise TypeError`


#####增量运算符  
+=、-=、*=、/= 等等

对于可变对象，如果对象没有定义`__iadd__`方法，那么`a += b`会被作为`a = a + b`解析，调用`__add__`方法或者b的`__radd__`方法；但是如果对象a定义了`__iadd__`方法，那么就会直接调用该方法，而不会调用`__add__`

`__add__`这类*infix*方法与`__iadd__`这类in-place方法，主要的区别在于*infix*方法会返回新的对象，*in-place*方法则直接改变表达式左边的对象  
*infix*方法返回计算结果组成的新对象，增量操作等*in-place*方法返回self

如果进行运算的两个操作数都是不可变对象，则无论*infix*方法还是*in-place*方法，都会生成新的对象

######处理不同类型的操作数

 - 以duck typing方式，直接进行操作，捕获TypeError异常  
 - goose typing方式，使用`isinstance(scalar, numbers.Real)`这样判断是否是抽象类的实例的方式进行类型检查

如果进行运算的两个对象都是相同类型的对象，那么可以只定义`__mul__`这样的正向运算方法，因为如果有需要调用`__rmul__`的场景，也就意味着传入的对象类型发生了改变


Chapter 14

#####iterator与iterable的关系  

 - *iterable* 实装了`__iter__`方法，并且该方法返回一个iterator，那么这个对象是iterable的；如果一个对象实装了下标从数字0开始的`__getitem__`方法，那么该对象也是iterable的
 - *iterator* 实装了`__next__`(Python3)或者`next`(Python2)方法，该方法不接收参数，按顺序返回下一个元素，直到没有元素，返回-StopIteration-异常，这样的对象是iterator。iterator本身也实装了`__iter__`方法，因此它们也是iterable的

iter函数  
返回可以用于遍历iterable的iterator，传入iterable对象，iter函数返回iterator


自定义的iterator最好同时实装`__next__`和`__iter__`两个方法，使`issubclass(SentenceIterator, abc.Iterator)`判断可以通过  
如果iterator继承自`abc.Iterator`，那么也会继承`abc.Iterator.__iter__`这个具体方法

iterable对象不需要实装iterator的`__next__`方法，iterable对象不需要必须是iterator，这点在设计时需要注意，避免混淆

关于生成器遍历

```Python
def gen_1():
    print("start")
    yield "AA"
    print("continue")
    yield "BB"
    print("end")
    yield "CC"
>>> a, b, c = gen_1()  # 生成器只会存储yield的值
start  # 遍历生成器时会执行yield之前的代码
continue  # yield "BB"之前的print
end  # yield "CC"之前的print
>>> a  # 多重赋值只包含yield的值，没有print部分
'AA'
>>> b
'BB'
>>> c
'CC'
>>> 
```


`re.finditer`返回一个生成器，包含匹配到的所有对象的MatchObject(需要使用.group()方法才能获取匹配到的对象内容)，其他方面类似`re.findall`

```
for match in re.findter("\w+", str1):
    print(match.group())
```

*lazy evaluation* & *eager evaluation*

```Python
def gen_1():
    print("start")
    yield "AA"
    print("continue")
    yield "BB"
    print("end")
    yield "CC"
>>> g1 = (e for e in gen_1())  # 生成generator expression时没有执行函数
>>> g1 = (e for e in gen_1())
>>> for e in g1:
...     print(e)
...     print("-"*5)
... 
start
AA
-----  # 每次遍历时执行函数到yield位置
continue
BB
-----
end
CC
-----  #  直到遍历完毕
>>> 
```

for循环遍历iterable时，会自动生成iterator，并且会自动处理StopIteration异常，不需要手动判断是否已经全部遍历

对于float类型的数据，最好尽量减少四则运算的次数，防止因大量运算导致误差积累

无限累加数字的生成器，适用于几乎所有数字类型，功能与`itertools.count(start, step)`类似

```
def arithmatic_progression(start, step, end=None):
    result = type(start + step)(start)  # type返回的类型对象可以直接使用，进行强制类型转换
    index = 0
    while end is None or result < end:
        yield result
        index += 1
        result += step * index  # 使用index的倍数乘法，而不是直接累加step，减少运算次数
```

`itertools.takewhile(func, iterable)` 遍历整个序列，直到func函数返回False

`itertools.product` 产生两个iterable的笛卡尔积，参数iterable只有一个的话，则返回与None的组合，返回类型是generator
`itertools.zip`与`itertools.zip_longest`  自动遍历停止与不停止而使用默认值填充
`itertools.groupby` 参数key可以指定不同的分类函数，返回分组结果的generator和key组成的集合，作为参数传入的iterator必须是排好序的

```
>>> l1 = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
>>> l1.sort(key=lambda e: e % 5)
>>> l1
[5, 0, 6, 1, 7, 2, 8, 3, 9, 4]
>>> for k, group_iter in itertools.groupby(l1, key=lambda e: e % 5):
...     print("{} -> {}".format(k, list(group_iter)))
... 
0 -> [5, 0]
1 -> [6, 1]
2 -> [7, 2]
3 -> [8, 3]
4 -> [9, 4]
>>> 
```

`itertools.count`和`itertools.repeat`  生成无限数字的generator

`itertools.tee(it, n)` 返回n个重复的t的集合，n默认值是2

```
>>> t1 = itertools.tee("dfgd", 5)
>>> t1
(<itertools.tee object at 0x10c96f2d8>, <itertools.tee object at 0x10c96f320>, <itertools.tee object at 0x10c9068c0>, <itertools.tee object at 0x10c906560>, <itertools.tee object at 0x10c906d88>)
>>> for i, j in itertools.permutations(range(5), 2):
...     print(t1[i] is t1[j])
... 
False
False
False
False
False
False
False
False
False
False  # 返回的t1里的generator全部是新的
>>>
```

`yield from`  仅适用于Python3，不需要循环遍历整个iterable对象再单独yield，可以直接根据目标对象生成遍历所有元素的generator

```
def chain(*iterables):
    for it in iterables:
        yield from it
>>> chain("ASD", "fgd")  # 返回generator
<generator object chain at 0x102a5c888>
>>> list(chain("ASD", "fgd"))
['A', 'S', 'D', 'f', 'g', 'd']
>>> 
```

`all([])` 会返回True，需要注意  
`any([])` 返回False

iter函数除了生成遍历iterable的iterator对象，还可以传入两个参数，第一个是可以被重复调用的函数，用于返回被yield的值，第二个参数是特定的值，当第一个参数返回该值时，iter函数不返回该值而是触发StopIteration异常，遍历结束，作用相当于拦截器

```
from random import randint
d6 = lambda: randint(1, 10)
list(iter(d6, 5))
>>> list(iter(d6, 5))
[10, 8, 10, 2, 1, 9, 2, 6, 3, 8, 9, 3, 9, 3, 9, 9, 4, 7, 10, 9]
>>> list(iter(d6, 5))
[2, 8]  # 由于产生的数字随机，每次结果都可能不同
>>> list(iter(d6, 5))
[]  # 也可能出现第一个数字触发StopIteration的情况
>>>
```

`generator.send` 向生成器内部发送数据，并返回下一个取得的数据(即调用next方法的返回值)，用于使用generator管理coroutine的场景

gengerator实装了`__next__`和`__iter__`方法，可以看做iterator

###chapter 15  Context manager and else blocks

#####else语句
除了if/else的用法，else还可以在for、while、try等语境下使用

 - **for** else部分只会在for循环正常结束的情况下运行，如果是由于break导致的循环结束，else部分不会被执行
 - **while** else部分只会在判断条件变成False时执行，break终止循环后不会执行else部分
 - **try** else部分只会在try内的代码没有出现异常时执行，else部分代码中出现的异常，不会被前面的except捕获

在这种语境下，else的作用类似then，表示正常情况下上面的代码执行之后，后续应该如何

######术语
*EAFP* Easier to Ask for Forgiveness than Permission  相比去要求访问权限，直接尝试访问然后处理可能出现的异常情况更容易一些
*LBYL* Look before You Leap  访问之前先去确定目标存在，并保持该状态直到访问操作执行(使用锁或其他机制)

可能场景：  
对于一个map，A线程检查到某个key存在，但是在A线程发起访问之前，该key被B线程删除  
EAFP解决方法：使用try/except方式访问map，收到异常时进行异常处理  
LBYL解决方法：在A线程检查到key存在后，使用线程锁将该map锁定，直到访问结束才释放map对象

#####with模块  
进入with模块时执行with后的对象的`__enter__`方法，`__enter__`方法如果有返回对象，可以使用as关键字赋予变量名，在with内的代码中使用  
as部分也可省略，表示后续代码仅在with作用域内执行  
with内部的代码执行结束后，会执行`__exit__`方法，处理with内为关闭的连接或者文件对象等，以及其他正常的结束处理，返回True表示异常已在方法内部被处理，不需要外部操作。如果返回None，则`__exit__`方法收到的异常会向上一层抛出

`__enter__`方法不接受参数，返回对象可以是None也可以是self(open函数处理文件时)或者其他对象  
`__exit__`方法接受三个参数，用于在异常处理时使用

 1. `exc_type` 异常类型
 2. `exc_value` 被抛出的异常对象本身
 3. `traceback` traceback对象

with模块的用法：控制数据库连接，在threading模块中控制锁、条件判断和信号控制等，使用Decimal对象生成用于数学计算的环境，在测试时加载临时模块

with模块不会创建新的作用域，即使as赋值的变量，在with模块结束后，仍然可以被访问

@contextlib.contextmanager  装饰器，生成可以在with结构中使用的context manager  
被contextmanager修饰的函数中必须有yield，即是生成器函数  
函数中yield之前的部分与普通的context manager类的`__enter__`方法相同，yield可以有对象，作用类似`__enter__`方法的返回值，用于as部分  
yield后的部分作用于`__exit__`方法相同，不同的是此时被传入generator的异常会被视为已经处理掉的，不会被向上抛出。如果需要手动处理异常，则需要在被装饰的函数中重新抛出  
最好在被contextmanager修饰的函数的yield部分，使用try/except捕捉可能被抛出的异常，防止因with内代码产生异常导致yield后的代码无法执行，被改变的context(上下文)无法恢复

```Python3
>>> from contextlib import contextmanager
>>> @contextmanager
... def mirror():
...     import sys
...     original_write = sys.stdout.write
...     def reversed_write(texts):
...         original_write(texts[::-1])
...     sys.stdout.write = reversed_write
...     msg = ""
...     try:
...         yield "Who let the dogs out?"  # yield部分有异常处理
...     except Exception as te:
...         msg = "Wrong attribute attached!"
...     finally:
...         sys.stdout.write = original_write
...         if msg: print(msg)
... 
>>> with mirror() as what:
...     print(1234567890)
...     print(what)
... 
0987654321
?tuo sgod eht tel ohW
>>> with mirror() as what:
...     print(1234567890)
...     "wer".fg  # 触发异常的语句
...     print(what)
... 
0987654321
Wrong attribute attached!  # 异常被捕获
>>> print(what)  # with运行结束后环境正常输出
Who let the dogs out?
>>> 12345
12345
>>> 
>>> @contextmanager
... def mirror2():
...     import sys
...     original_write = sys.stdout.write
...     def reversed_write(texts):
...         original_write(texts[::-1])
...     sys.stdout.write = reversed_write
...     yield "Who let the dogs out?"  # 没有在yield部分做异常处理
...     sys.stdout.write = original_write
... 
>>> with mirror2() as what:
...     print(1234567890)
...     print(what)
... 
0987654321
?tuo sgod eht tel ohW
>>> with mirror2() as what:
...     print(1234567890)
...     "dfg".dfg  # 异常操作
...     print(what)
... 
0987654321
Traceback (most recent call last):
  File "<stdin>", line 3, in <module>
AttributeError: 'str' object has no attribute 'dfg'  # 出错，没有执行到with的__exit__
>>> what  # 正常环境仍然没有恢复
'?tuo sgod eht tel ohW'
>>> 12345
54321
>>>
```

###chapter 16 coroutines
coroutine是流程控制的一种形式  
coroutine常见的形式是生成器函数  

```Python3
def simple_coro(a):
    print("-> Started: a = {}".format(a))
    b = yield a
    print("-> Received: b = {}".format(b))
    c = yield a + b
    print("-> Received: c = {}".format(c))
```

`coroutine_gen.send(val)` 继续执行coroutine到下一个yield语句，然后返回send的参数，而不是函数中被yield的变量，这是与next方法不同的地方  
因此，对于send方法，在coroutine函数刚刚被初始化时，由于尚未执行到第一个yield语句，无从赋值，所以无法被执行，会返回TypeError

函数中有yield存在，yield表达式可以有返回值，该返回值会在next函数或者coroutine_gen.send执行时被赋予表达式等号左边的变量  
每次next或者send调用，都会执行到一个yield语句，然后停止，等待下次next/send调用

```
>>> coroutine1 = simple_coro(12)
>>> next(coroutine1)
-> Started: a = 12
12  # 执行到第一次yield停止，b尚未被赋值
>>> coroutine1.send(22)
-> Received: b = 22  # 通过send方法，b被赋值为22
34  # 此时a + b的结果
>>> coroutine1.send(44)  # c被赋值为44，覆盖原结果
-> Received: c = 44
Traceback (most recent call last):  # 生成器执行结束，没有后续的yield，抛出StopIteration异常
  File "<stdin>", line 1, in <module>
StopIteration
>>> 
```

corountine从被声明开始，存在四种状态：

 1. *GEN_CREATED*  刚被声明，没有被执行
 2. *GEN_RUNNING*  被编译器编译，多线程运行或者执行`inspect.getgeneratorstate(coro_gen)`时
 3. *GEN_SUSPENDED*  被调用next或者send方法执行到yield语句时
 4. *GEN_CLOSED*  coroutine执行结束

可以使用*inspect.getgeneratorstate*查看coroutine对象当前的状态

```
>>> from inspect import getgeneratorstate
>>> coro2 = simple_coro(1)
>>> getgeneratorstate(coro2)  # 刚被创建时
'GEN_CREATED'
>>> next(coro2)  # 第一次调用next函数，无法使用send方法
-> Started: a = 1
1
>>> getgeneratorstate(coro2)  # 执行到第一个yield语句
'GEN_SUSPENDED'
>>> coro2.send(123)
-> Received: b = 123
124
>>> getgeneratorstate(coro2)  # 第二个yield语句
'GEN_SUSPENDED'
>>> coro2.send(4)
-> Received: c = 4
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
StopIteration
>>> getgeneratorstate(coro2)  # 执行结束
'GEN_CLOSED'
>>> 
```

使用corountine定义averager

```
def coro_avg():
    total, count, average = 0.0, 0, 0
    while 1:
        new_input = yield average
        total += new_input
        count += 1
        average = total / count
>>> coro1 = coro_avg()
>>> next(coro1)  # corountine对象在正式使用之前，需要先执行next，使其进入GEN_SUSPENDED状态
0
>>> coro1.send(10)
10.0
>>> coro1.send(10)
10.0
>>> coro1.send(200)
73.33333333333333
>>>
```

每次调用corountine时，被yield的变量的值会被返回，send方法传递的值，会被赋给yield语句的赋值变量

可以定义专门用于coroutine初始化，给返回对象执行next函数的装饰器

coroutine在内部出现异常时，如果异常没有被处理，那么会抛出该异常，然后coroutine本身进入GEN_CLOSED状态，停止遍历，如果继续调用next或者send方法，会触发StopIteration异常

generator.throw(异常)  在yield语句处触发参数中的异常，如果异常被处理，则继续执行，否则抛出异常  
generator.close()  关闭generator，使其状态变成GEN_CLOSED，继续遍历会触发StopIteration


```Python3
from inspect import getgeneratorstate

class DemoException(Exception):
    pass

def demo_coro():
    print("Coroutine starts...")
    try:
        while True:
            try:
                x = yield
            except DemoException:
                print("**** DemoException handled, continue...")
            else:
                print("-> coroutine received: {!r}".format(x))
    finally:
        print("Corountine ends")

>>> coro1 = demo_coro()
>>> next(coro1)
Coroutine starts...
>>> coro1.send(234)
-> coroutine received: 234
>>> getgeneratorstate(coro1)  # send方法，正常的coroutine起始状态
'GEN_SUSPENDED'
>>> coro1.send(DemoException)  # 即使send发送的是Exception，也不会被视为coroutine内部的异常，只会被作为对象
-> coroutine received: <class '__main__.DemoException'>
>>> getgeneratorstate(coro1)  # coroutine的状态仍然是GEN_SUSPENDED
'GEN_SUSPENDED'
>>> coro1.send(TypeError)
-> coroutine received: <class 'TypeError'>
>>> getgeneratorstate(coro1)
'GEN_SUSPENDED'
>>> coro1.throw(DemoException)  # throw传入的异常会被视为coroutine内部产生的异常
**** DemoException handled, continue...  # 进入内部的异常处理逻辑
>>> getgeneratorstate(coro1)  # 传入的异常被处理，coroutine仍然是正常状态
'GEN_SUSPENDED'
>>> coro1.throw(TypeError)  # throw传入未被处理的异常，无法被处理，直接抛出
Corountine ends  # finally部分
Traceback (most recent call last):  # 抛出的异常
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 6, in demo_coro
TypeError
>>> getgeneratorstate(coro1)  # 此时coroutine的状态已变成GEN_CLOSED
'GEN_CLOSED'
>>> next(coro1)  # next函数触发StopIteration
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
StopIteration
>>> coro1.send("QQQ")  # send方法相同
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
StopIteration
>>>
```

**generator.close()**

前置接上声明

```Python3
>>> coro2 = demo_coro()
>>> next(coro2)
Coroutine starts...
>>> getgeneratorstate(coro2)  # 已进入GEN_SUSPENDED状态
'GEN_SUSPENDED'
>>> coro2.send(35)
-> coroutine received: 35
>>> coro2.close()  # 关闭coroutine
Corountine ends
>>> getgeneratorstate(coro2)  # coroutine状态变为GEN_CLOSED
'GEN_CLOSED'
>>> coro2.send(31)  # 继续遍历则发现coroutine已停止
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
StopIteration
>>> next(coro2)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
StopIteration
>>>
```

coroutine函数可以添加return语句，在generator遍历结束时，返回指定结果，函数中同时存在yield和return的写法，在Python3.3引入  
如果generator部分出错，那么return的返回结果会在抛出的异常中的value属性中，corountine遍历结束，正常的返回值也是在StopIteration.value中

`yield from` 则可以内部处理StopIteration异常，接收最后的返回值返回给用户

the delegating generator中的yield from作用类似管道，通向一个或者多个yield，使用yield from调用subgenerator  
subgenerator中除了yield，也可以使用return返回值，那么在yield循环结束后，return的返回值会被作为subgenerator的返回值传回yield from语句

在实际应用中，除了通过yield from连接多个subgenerator，还要考虑异常处理的情况

在使用delegating generator的返回对象，通过send方法向subgenerator发送数据时，如果使用throw方法发送异常，  
只有GeneratorExit异常会被传入delegating generator，因此需要在delegating generator中处理，其他的异常都会被传入subgenerator,  
而如果subgenerator内产生了异常，StopIteration异常会被delegating generator接收并处理，其他异常则会被抛出

如果delegating generator的返回对象执行close方法，subgenerator如果有close方法，则也会执行，如果subgenerator执行出错，异常会被传给delegating generator，如果正常执行，那么会返回GeneratorExit给delegating generator


discrete event simulation DES

taxi cabs simulation

Queue.PriorityQueue(maxsize=0)  可以定义最大长度，达到最大长度后无法继续插入数据，内部数据根据元素的第一个元素进行排序，maxsize是0或None时表示最大长度无限制

3 types using generators

 - "pull" style  iterator
 - "push" style  push values via send, like the averaging example
 - "tasks"  异步任务，并发实现

**yield from subgenerator**  默认subgenertaor是未prime的，会通过yield from自动prime到GEN_SUSPEND状态

```
def pump(ins, outs):
    for chunck in gen(ins):
        yield from outs.write(chunck)

def gen(ins):
    yield "<b>"
    yield from ins.read_in_chuncks(1000*1000*1000)
    yield "<b>"
```

对于ins中的所有事件来说，pump中的每次循环都将执行在同一个位置的yield，
因此对于不同的gen(ins)元素，pump函数的执行过程互不关联，输出的chunck的写操作可以认为是异步的


```
def coroutine1():
    while 1:
        line = (yield)  # 不需要输出时，yield语句直接赋值，需要加上括号，防止将关键字赋值
        ...
```

###Chapter 17 Concurrency with future

Python2中单行输出print结果，可以在print元素末尾添加逗号；Python3中则可以定义print函数的end参数，使输出不换行

```Python3
import sys
print("ASD", end=" ")
sys.stdout.flush()
```

Python默认会在遇到换行符时flush stdout的buffer，如果需要输出限制在一行，则要手动调用sys.stdout.flush()刷新输出buffer

time.sleep() 也会释放当前占用的线程资源，直接等待结束

> The Python threads are good at doing nothing.
> Just waiting for the main process being released.

如果是CPU密集型的场景，速度更快的pypy更为适用

Python3引入了新的concurrent包  
concurrent.futures  
futures.ThreadPoolExecutor  
executor.submit  
futures.as_complete  
futures.ProcessPoolExecutor

tqdm Python的进度条包，可以接收iterator，然后根据完成情况估算剩余时间

```
from time import sleep
from tqdm import tqdm
for i in tqdm(range(1000)):
    sleep(.01)

```

可以hash的对象，都可以作为dict的key

由于GIL的存在，单进程的Python程序的运行效率可以提高近20倍  
Python的多线程可以用于并发IO的场景，threading库作为标准库，还是有其存在的价值的


###Chapter 18 Concurrency with asyncio

> Concurrency is not parallelism, it's better.
> With concurrency you can do 100 tasks concurrently with only one core,
> while to archive parallelism, you need to assign one core per task.

asyncio is named with "Tulip" before included into standard library in Python 3.4

生成运行动画

```
from time import sleep
import sys, itertools
for c in itertools.cycle("|/-\\"):
    sys.stdout.write(c)
    sys.stdout.flush()
    sys.stdout.write("\x08" * len(c))  #在原地输出的关键是在重新写入之前，写入原有字符长度的退格键"\x08"
    sleep(.1)
```

根据设计，Python中没有结束线程的API只能等到程序结束或者不再被引用时自动回收

#####线程与协程的区别

######asyncio.Task vs. threading.Thread  
 * Task类似于像gevent这样专用于多进程的特殊线程
 * Task执行一个协程，Thread执行的则是一个可执行对象
 * 用户不能直接创建Task对象，必须是通过将coroutine传入**asyncio.async()**或者**loop.create_task()**方法这样的方式，才能获取一个scheduled Task
 * Thread执行时，被执行的对象是被作为普通的可执行对象执行的，不需要特殊的执行方式；而Task中执行操作则是通过**yield from coroutine1**这样的方式
 * 出于运行环境稳定性的考量，没有API可以从外部停止Thread；而实例方法Task.cancel()可以在coroutine内部触发**CancelledError**，coroutine可以捕获该异常来判断是否需要终止任务执行
 * 被@asyncio.coroutine修饰的函数，必须通过`loop.run_until_complete()`来调用执行，才可以正常运行

多线程之间需要进行协调处理，为了保证线程间的数据同步，还需要考虑使用线程锁和死锁的可能  
但是对于协程，同一时间实际运行的协程只会有一个，不存在这些问题

######asyncio.Future vs. concurrent.futures.Future
 - `BaseEventLoop.create_task()` 创建coroutine并将它放进事件循环中；Executor.submit()创建concurrent.futures.Future实例  
 - asyncio.Future同样有`.done()`、`.add_done_callback()`、`.results()`等方法，`.done()`、`.add_done_callback()`与concurrent.futures.Future的同名方法的用法类似，但是asyncio.Future的`.result()`方法不接收参数，无法指定timeout时间，执行时不会阻塞正在等待执行结束的程序，而是返回异常*asyncio.InvalidStateError*  
 - 使用`variable1 = yield from asyncio.Future实例`，之后附加后续代码的写法，作用和将后续代码写在`.add_done_callback()`中提交给事件作用相同，因为yield from会自动处理suspended状态的函数状态变化后的返回值，并将它返回给主调用过程  
 - 通过使用yield from，操作asyncio.Future可以省去繁复的`.done()`、`.add_done_callback()`、`.results()`等方法的调用

I/O asynchronous
Only the application code blocks on I/O scenarios, the main thread on which the event loop and application code are running never blocks

CPU的运算速度比内存和硬盘的读写速度快得多，因此使用非阻塞IO的函数，可以很大程度上提高程序的运行速度。NodeJS也是同样的道理

如果在一个函数中使用了yield from而使其成为异步函数，就不能以普通函数的调用方式使用，而需要先声明一个事件循环，通过事件循环执行异步函数(`loop.create_task(three_stage(step1))`)

`loop.run_in_executor` 可以在异步函数内部异步执行指定的函数


关于何时使用yield from: 一般规则是对`asyncio.Future`的实例和coroutine使用yield from  
使用with语句控制semaphore的作用范围

####Gevent
gevent yield语句、IO异步，网络连接、文件操作均会异步处理
"确定的并发" gevent的map、`imap_unordered`等的并发结果会按照提交顺序返回，不会因为是异步而产生不同顺序的返回结果

创建greenlet的方法：

 1. `gevent.spawn(func, args)`创建异步程序
 2. `gevent.Greenlet.spawn(func, args)`，以上两个方式创建异步程序后，需要放在一个数组中，调用gevent.joinall运行
 3. 继承`gevent.Greenlet`，重载`_run`方法，然后实例化，再调用`Greenlet.start`和`Greenlet.join`运行实例

gevent.spawn返回的异步进程，一个greenlet，本身的状态和异常都被保存在自身状态中，并不会向上层抛出  
也就是说，一个greenlet运行时如果产生了异常而且未被处理，异常也只会出现在greenlet.exception中，不会抛出到调用程序

gevent.Timeout 可以设置全局异步的tiemout时间限制，也可以用在with控制的上下文中，限制作用范围

```
from gevent import Timeout

class TooLong(Exception):
    pass

with Timeout(time_to_wait, TooLong):
    gevent.sleep(10)
```

一个Timeout类实例的start方法，作用范围是到另一个`Timeout.start_new`之前，也可以是全局范围的


`gevent.monkey.patch_socket()` 只修改标准的socket库为gevent的异步socket
`gevent.monkey.patch_all()` 修改所有的IO操作和yield等操作为异步的

猴子补丁(monkey patching)是一种"有用的邪恶(useful evil)"，很容易被滥用


greenlet之间通过事件(event)进行通信，类似multiprocessing中多进程之间的Queue、Pipe等类  
`gevent.pool.Group` 管理、运行greeenlet的  
运行重复的任务时，可以使用`gevent.pool.Pool`  

Windows不能监视pipe事件

Actors模型，每个Actor有一个可以从其他Actors接收消息的收件箱，Actor内部的主循环遍历收到的消息，根据消息期望的行为采取操作

asyncio.StreamWriter中  
write方法是将数据写入缓存(buffer)，但未必直接输出到IO，因此是非阻塞的同步方法  
drain方法是将缓存数据全部输出到IO，并清空缓存，是异步方法，需要通过yield from 调用

同理，asyncio.StreamReader.readline也是异步方法，需要yield from调用

aiohttp的http server程序，会自动将非异步的后台方法转化成异步方法执行

Vaurien库 为TCP请求在前台和后台服务器/数据库之间的通信添加延迟和失败率

###Chapter 19 dynamic attribute

*getattr*对应内部方法`__getattr__(self, key)`

*@classmethod*  修饰类方法，接收的参数是类对象和传给类对象的参数对象

`__new__`方法属于classmethod，之所以重写时不需要加上@classmethod装饰器，是因为编译器会识别这个方法并对它单独处理  
`__new__`方法接收类对象和调用类对象时传入的参数，`__new__`必须返回一个实例，如果该实例是参数中的类对象的实例，那么编译器会在之后调用该类的`__init__`方法初始化对象，`__init__`接收的self参数，就是`__new__`返回的实例对象  
`__new__`也可以返回其他类的实例对象，这样的话编译器检查到返回实例不是参数类的实例时，就不会调用参数类的`__init__`方法

`self.__dict__.update(kwargs)`  更新键值对参数到类属性，如果有在`__slots__`定义的同名属性，则不会被更改  
但是这样定义的类，如果有其他的方法，初始化或者被继承之后可能会有同名属性覆盖方法的情况，需要注意  
这时可以考虑将方法定义成classmethod，然后通过`self.__class__.xxx()`调用

@property  修饰内部方法，可以将其作为只读属性以点号的方式调用

```
>>> class TC1(object):
...     @property
...     def p1(self, a=6):
...         print("param a: {}".format(a))
...         return "Readonly property p1"
... 
>>> 
>>> tc = TC1()
>>> tc.p1
param a: 6
'Readonly property p1'
>>> tc.p1(45)  # 即使定义了参数，也无法被直接以函数的形式调用，除非原本返回的就是个接收参数的callable对象
param a: 6
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: 'str' object is not callable
>>> tc.p1 == "Readonly property p1"
param a: 6
True
>>> 
>>> tc.p1="123"  # 无法被赋值
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: can't set attribute
>>>
```

某个被@property修饰的属性，也可以通过设置同名的setter方法，使它可以被赋值

```
class LineItem:
    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price
    def subtotal(self):
        return self.weight * self.price
    @property
    def weight(self):
        return self._weight
    @weight.setter  # 装饰符是“属性名.setter”的形式
    def weight(self, value):  # setter方法与getter方法和暴露给外部的属性名相同
        if value > 0:
            self._weight = value
        else:
            raise ValueError('value must be above 0')
>>> li1 = LineItem("cereals", 100, 2.4)
>>> dir(li1)  # 看不到getter和setter方法定义的_weight属性
['__doc__', '__init__', '__module__', 'description', 'price', 'subtotal', 'weight']
>>> li1.weight
100
>>> li1.subtotal()
240.0
>>> li1.weight = 200  # weight可以被直接赋值
>>> li1.subtotal()
480.0
>>> li1.TRE = 546  # 使用赋值语句增加新的属性不会报错
>>> dir(li1)
['TRE', '__doc__', '__init__', '__module__', 'description', 'price', 'subtotal', 'weight']
>>>
```

> The cure for repetition is abstraction.

标准库函数*vars*  有参数传入时，返回该参数对象的`__dict__`属性；没有参数传入时，返回结果和locals()相同

定义docstirng的方式

 - 在使用@property装饰器时传入doc参数
  `weight = property(get_weight, set_weight, doc="weight in kilograms")`
 - 设置对象的`__doc__`属性
 - 在声明语句开始时使用文本块("""或''')写出，会被编译器自动作为docstring使用
 
 ```
>>> class Class(object):
...     """Default docstring for Class"""  # 定义了docstring，如果没有其他内容，可以不写pass
... 
>>> Class.__doc__
'Default docstring for Class'
>>> 
 ```

属性名.deleter  装饰器可以用于定义删除属性时使用的方法，使用`del 实例名.属性a`删除属性，也可以使用内部方法`__delattr__`


?? 编译器查找属性时，默认是从`__class__`开始的，也就是说，类属性会覆盖实例同名属性

`__slots__`定义类中允许存在的属性，定义了`__slots__`的类的实例中，没有`__dict__`属性

```
class TestClass1(object):
    def __init__(self):
        self.cereals = ["rice", "wheat", "grains"]
    def __delattr__(self, name):
        if name == "cereals" and self.cereals:
            print("Lost {}".format(self.cereals.pop()))
        else:
            del self.__dict__[name]

>>> c1 = TestClass1()
>>> del c1.cereals
Lost grains
>>> del c1.cereals
Lost wheat
>>> del c1.cereals
Lost rice
>>> del c1.cereals  # 可以正常删除self.__dict__中的key
>>> 
>>> c1.re = 545  # 允许以赋值的方式增加新的属性
>>> del c1.re
>>> 

class TestClass2(object):
    __slots__ = ("cereals")
    def __init__(self):
        self.cereals = ["rice", "wheat", "grains"]
    def __delattr__(self, name):
        if name == "cereals" and self.cereals:
            print("Lost {}".format(self.cereals.pop()))
        else:
            del self.__dict__[name]

>>> c2 = TestClass2()
>>> del c2.cereals
Lost grains
>>> del c2.cereals
Lost wheat
>>> del c2.cereals
Lost rice
>>> del c2.cereals  # __slots__代替了__dict__，因此del self.__dict__的写法出错
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 9, in __delattr__
AttributeError: 'TestClass2' object has no attribute '__dict__'
>>> c2.re = 345  # 不能给实例添加新的属性
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'TestClass2' object has no attribute 're'
>>> 
```

标准库函数*dir*  有参数时返回参数对象的属性，返回结果中不会列出`__dict__`，但是会列出`__dict__`中的键，此外，`__mro__`、`__bases__`和`__name__`属性也不会被列出  
没有传入参数时，dir调用会列出当前作用范围内的可用对象名  
与vars返回`__dict__`的设计正好相反

getattr、setattr、del、dir这些标准库函数都会触发对应的内部函数，所有功能实际上是在内部函数中实现的

getattr  首先触发`__getattribute__`，当在对象、类和子类中找不到指定的属性名时，会去取得`obj.no_such_attr`属性，然后执行的`getattr(obj, 'no_such_attr')`和`hasattr(obj, 'no_such_attr')`才会触发`Class.__getattr__(obj, 'no_such_attr')`方法  

setattr  触发`__setattr__`方法，对象属性的点式赋值和setattr函数都会触发`Class.__setattr__(obj, 'attr', value)`  

`__delattr__`、`__dir__`、`__getattr__`、`__getattribute__`、`__setattr__`这些方法都是类方法，使用时也是通过类对象被调用 `dir(x) 等价于 x.__class__.__dir__(xx)`，因此不会被实例的同名属性覆盖

如果自定义类没有实装`__get__`方法，那么默认的`__get__`会查找`__dict__`属性，因此实例属性如果被写入，则会覆盖同名(namesake)类属性

###chapter 20

重写`__set__`或`__setattr__`方法时，需要注意不要直接使用当前对象本身的赋值方法，不然可能会造成死循环递归

overridding descriptor  重写内部`__set__`方法的descriptor

descriptor的主要应用场景是用于实现抽象出的第一层、第二层甚至更高的实体关系，通过一层层类的组合继承，完成对于一个规则的完整实现，不同规则之间如果存在相同的高层次抽象，那么代表高层次抽象的类中，对应的规则可以被定义为`@abc.abstractmethod`抽象方法，分别在子类中进行不同的实现

#####`__get__`和`__set__`方法的非对称性
当查找一个Python对象的某个属性时，如果实例中不包含这个属性，那么会去类属性里寻找，如果找不到，才报出AttributeError  
而设置对象的某个属性时，即使该对象没有特定的属性，也可以直接赋值而给对象添加属性，这不会影响类属性

`__set__`方法在实例属性被赋值时调用，但是`__get__`却会在当实例中没有指定名称的属性时去类中查询；因此对一类对象的属性，如果要实现自定义的get和set操作，就需要在类对象的父类(也就是元类，metaclass)中定义`__set__`和`__get__`方法

>Tip:  
>`assert "STRESSED"[::-1] == "DESSERTS"`

类对象和实例对象中都会保存对类方法的引用，它们指向同一个对象，但是对编译器来说，类对象指向的方法是一个函数，而实例对象的引用，指向的则是类方法


#####Descriptor usage tips
 1. 使用*property*函数/装饰器  如果是定义只读属性，那么使用property可以很方便的完成功能
 2. 只读的descriptor需要定义`__set__`方法 如果只定义了`__get__`方法，那么给同名属性赋值时，原有的值会被覆盖，因此最好也定义`__set__`方法，使对只读属性进行赋值操作时，抛出*AttributeError*异常
 3. 属性有效性检查只在`__set__`方法中起作用
 4. 缓存数据只需要`__get__`方法  如果获取某个值需要耗费很长的时间，那么可以在`__get__`方法里定义取值操作，直到使用时才去取值，而且只需要花费一次等待时间，后续的取值都可以从实例的`__dict__`中取得，不会再一次触发`__get__`方法
 5. 普通的类方法可以被实例的同名属性覆盖  特殊的类方法则会在调用时直接读取类方法，不从实例读取，因此不会被覆盖

 

###chapter 21 class metaprogramming
record_factory 类似collections.namedtuple的实现，这样产生的实例无法被pickle序列化

```
def record_factory(cls_name, field_names):
    try:
        field_names = field_names.replace(",", " ").split()
    except AttributeError:
        pass
    field_names = tuple(field_names)

    def __init__(self, *args, **kwargs):
        attrs = dict(zip(self.__slots__, args))
        attrs.update(kwargs)
        for name, value in attrs.items():
            setattr(self, name, value)

    def __iter__(self):
        for name in self.__slots__:
            yield getattr(self, name)

    def __repr__(self):
        values = ", ".join('{}={!r}'.format(*i) for i in zip(self.__slots__, self))
        return "{}({})".format(self.__class__.__name__, values)

    cls_attrs = dict(
        __slots__ = field_names,
        __init__ = __init__,
        __iter__ = __iter__,
        __repr__ = __repr__
        )
    return type(cls_name, (object,), cls_attrs)

```


*class decorator*  直接在类初始化后接收返回的类对象，可以在这时对类对象进行重新修改  
不足之处是类装饰器只对父类起作用，无法作用于子类

```
# class decorator
def entity(cls):
    for key, attr in cls.__dict__.items():
        if isinstance(attr, Validated):
            type_name = type(attr).__name__
            attr.storage_name = '_{}#{}'.format(type_name, key)
    return cls  # 直接更新cls中的数据

# 使用
@entity
class LineItem:
    description = NonBlank()
    weight = Quantity()
    price = Quantity()
    def __init__(self, description, weight, price):
        ...

```


#####import time VS. run time  
对于函数声明，在import时编译器只会编译函数代码，而不会执行，只有在运行时才会去执行已经被编译的代码  
而对于类声明，不管是直接定义的外部类还是定义在类或函数内部的内部类，都会在import时被执行，定义类属性和方法，生成类对象

import时不会执行`if __name__ == "__main__": ...`里的代码，只有在运行时会执行

Python中的大多数类和用户自定义的类对象，都是**type**类的实例，也就是说type是它们的*metaclass*  
而type类是它自身的实例(防止自身循环递归)

以上类对象的顶层父类都是object，这与它们都是type类的实例不冲突

```
>>> str.__class__
<type 'type'>
>>> type.__class__
<type 'type'>
>>> 
```

如果一个类要实现metaclass的功能，那么就必须继承type类，以产生新的类  

使用`from A import b`的形式import时，仍然会处理整个模块  
子类中如果没有重新定义`__init__`方法，在编译时则会去调用父类的`__init__`方法  
在声明类时，可以通过*metaclass*参数指定所使用的元类，这样，在编译器编译了类之后，会使用指定的元类去构建类对象，而不是使用默认的type类

> 在Python2中，定义元类需要在类声明中指定`__metaclass__`属性，没办法像3里面那样以参数形式指定

`__prepare__`方法  
只在Python3中有效，只能用于元类的定义中，执行时间在`__new__`方法之前，记录被生成的类的属性名和属性对象的映射关系，保存在一个键值对形式的对象中返回，供`__init__`方法在初始化类时使用。  

如果`__prepare__`方法返回的是有序的映射关系，例如OrderedDict，那么就记录了在创建类时属性的创建顺序，如果将这个顺序保存在新创建的类对象中，那么类对象被创建时的属性创建顺序也就可以被保存下来

`cls.__bases__`  返回父类组成的tuple  
`cls.__qualname__`  返回以"."方式连接的父类名的字符串，如"A.B.C"  
`cls.subclasses()`  返回直接父类的弱引用
`cls.mro()`  返回`__mro__`属性中保存的父类信息

