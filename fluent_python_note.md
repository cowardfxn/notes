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

    The first thing to know about special methods is that they are meant to be called by the Python interpreter, and not by you. 

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
可以使用省略号对多维数组进行切割，x[i, ...] 等价于 x[i, :, :, :] (如果x是四维数组)

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

