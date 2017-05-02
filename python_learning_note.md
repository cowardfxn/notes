# Python笔记

**doc string** 三重引号，代码头部，shebang、import之后

if条件域中，数字0，空的list、tuple、dictionary的bool值为False，非零数字、非空的list、tuple、dictionary的bool值为True。  
即：  
*布尔环境中，0、''、{}、[]、()、None为False，其他任何东西都为真*

#####三重表达式Python版
`bool and a or b`

类似C中的问号表达式，但只有当a不为False时才有效

**进阶**

`bool_exp and [a] or [b]`

即使a为''，[a]仍为非空，`bool_exp `为真则返回[a]，为假则返回[b]，需要注意的是赋值的时候要解包

```
>>> a = 2
>>> b, = a > 6 and [0] or [a + 1]  # , 使用多重赋值解包
>>> b
3
>>> 
```
需要注意的是由于要构造新数组，因此参与运算的对象不宜太大

####bool运算符
**and** 返回最后一个真值，或者第一个假值  
**or** 返回第一个真值，或者最后一个假值  

and or 表达式从左到右运算，优先级相同

####基本数据结构
**list** 运算符'+' 相当于list.extend
若运算对象为大型list，extend性能更好

**tuple** 一旦被创建，就不能改变

tuple没有方法(仅在Python2中)，但可以用in

Dictionary {}
List []
Tuple ()

分割一个list会得到一个list，分割一个tuple会得到一个tuple。

tuple没有方法(指改变元素的操作)，但是支持in判断元素是否存在。

tuple可以用作Dicitonary的key。 Dictionary的key是不可变的。

python中range()会直接产生一个list对象，循环遍历的就是这个list
xrange()不会生成list，而是每次调用时通过计算返回一个值，类似yield功能。
因此xrange做循环时性能比range好，特别是数据量很大的时候。

######bind引用与unbind引用
类属性可以通过类而被引用，也可以借助实例被引用。两种方式公用同一个类属性。

######使用tuple多变量赋值，将一个dictionary映射为一个list

dictionary.items() 返回一个对应字典内容的list，其中元素是形如(key, value)的tuple

format conversion specifier

`getattr()` 标准函数，通过module名获取module的引用
sys.module()

module参数仅在模块被导入时计算一次


######文件操作
open返回的文件对象有write方法，但不会自动附带换行，需要手动添加

os.path.split()
os.path.splitext()
os.listdir()
os.path.isfile()
os.path.isdir()
os.getcwd()
os.path.normcase()
module glob
glob.glob() 可匹配所有子目录

嵌套函数

函数返回一个类，而非类的实例。在调用时传入参数即可实例化。
可实现动态的将类看成对象并传入参数，动态的实例化未知类型的类。

关于编译器返回语法错误
可讲编译器视作小狗，需要用合适的语言进行交流。

zip(*a) 
iter()

re.search(pattern, string)

####关于删除变量
python的del()函数只是删除变量名，无法删除变量所指向的值。要删除一个值(或某种数据结构)，需要删除所有指向该值的变量名，然后该值作为无法再被指向的废弃数据，有python编译器的gc回收

####scope 变量作用域
 - **locals()** 当前 module范围，返回局部命名空间的一个copy，更改变量不会造成实际影响
 - **globals()** 当前Python程序空间范围，返回实际的全局命名空间，更改变量会造成变量实际改变

`from module import ...` 是将*指定方法*导入locals()空间，`import module_name` 则是将*对象module*导入locals()空间


####参数传递
\* 修饰tuple，\*\*修饰dictionary。这种语法仅在参数列表中有效。
在函数*声明*时的\*，作用是表示从这个参数开始，参数列表中的其他参数都存储在一个由\*修饰名字的tuple中，作用范围直到参数列表结束或者遇到显示写出“参数名=默认值”这样的参数，因为这样的参数时存储在dictionary中的，而其后如果还有只写出参数值形式的参数，不再存储进之前的tuple  
函数声明时的\*\*， 作用是表示从该参数开始的key=value形式的参数存储入由\*\*修饰名字的dictionary中，作用范围同\*，遇到不同格式的参数定义时即结束。

在函数*调用*时参数中的\*，表示按顺序将该iterable变量传递给函数作为参数使用。

函数*调用*时的\*\*，表示传入的这个参数是一个dictionary，这个dictionary的所有key都应该是在函数声明时已经确定的参数，否则将报错。但如果函数声明时只是声明为dictionary，而未明确定义参数名，那么调用时的dictionary中key可以任意，后续操作必须引用传入的key才能取到对应的值。

最重要的一点，单个参数与\*修饰的tuple的位置可变，但是如果参数列表中存在\*\*修饰的dictionary，也即keyword arguments，必须将dictionary放在最后，否则报错。

一般的顺序：

```
def print_params_4(x, y, z=3, *pospar, **keypar):
    print x, y, z
    print pospar
    print keypar
```


A function such as multiplyByFactor that stores it enclosing scopes is called a closure.

If a function or an algorithm is complex and difficult to understand, clearly defining it in your own language before implementing it can be very useful. aka. pseudocode.

递归可以稍微增加函数的可读性

lambda表达式：mainly used to build in-line function

声明类的私有方法时，需要在方法前加上双下划线 \_\_inaccessible，这是一个convention


####MRO method resolution order
查询父类中属性或者方法的顺序，Python内置算法  
不同父类中有同名的方法时，优先使用声明时写在前面的父类的方法，并会使后面父类中的同名方法不可访问。（多重继承父类顺序很重要！）  


dict.get(name[, default])     # 查询不到key时返回default
字典的KeyError异常：当请求字典对象里面没有的key时,python会抛出异常KeyError。

####异常处理
Python3中except Exception(Exception, "msg")方式捕捉异常已被废弃，统一使用Exception as...

```
try:
    ...
except Exception as ecp:
    ...
else:
    ...
finally:
    ...
```

raise Exception   抛出异常，若raise后无参数异常，则抛出最近的一个异常(也可能为raise Empty，总会抛出一个异常)。


####生成器 generator
Any function that contains a yield statement is called a generator.

def flatten(nested):
    for sublist in nested:
        for element in sublist:
            yield element


####Package导入
package import的时候只是执行package目录下的\_\_init\_\_.py，如果\_\_init\_\_.py中没有import package内的module，则package内部的module仍不可用，如果需要使用，则仍需显式import

两种显式import package中module的方式：

```
 import package.module

 from package import module
```

####正则表达式
re

the period (dot) can match anything, so is called a wildcard (通配符).

\^ to invert the character set. '\[\^abc\]' matches any character except a, b, or c

? nongreedy mode 非贪婪模式

`emphasis_pattern = r'\*\*(.*?)\*\*'`

`(.*?)` matches the least substring needed to the next '\*\*'



set can remove duplicated elements

module email processes text saved email files



pat = re.compile(r'[a-z\-\.]+@[a-z\-\.]+', re.IGNORECASE)

pat.match().group(1)            MatchObject.group(0) is the entire string.

py的正则表达式也可以实现反向引用：

```
>>> i1
'helloWorld'
>>> ptr = re.compile('([A-Z])')
>>> ptr.match(i1)
>>> ptr.sub(lambda a: "_"+a.group().lower(), i1)
'hello_world'
```

python中使用正则表达式时，反斜线可能会将特殊字符转义，使其不能实现正常正则字符的功能，最好在所有正则字符串前添加r(仅Python2中)。

```
>>> i1
'CChheecckk yyoouurr dduupplleexx sswwiittcchh..'
>>> re.compile("(\w)\1").findall(i1)
[]
>>> re.compile(r"(.)\1").findall(i1)
['C', 'h', 'e', 'c', 'k', 'y', 'o', 'u', 'r', 'd', 'u', 'p', 'l', 'e', 'x', 's', 'w', 'i', 't', 'c', 'h', '.']
>>> 
>>> re.compile(r"(.)\1").sub(lambda a:a.group(1), i1)
'Check your duplex switch.'
```

#####re.search/re.match区别
re.match从字符串的第一个字符开始匹配，若第一个字符不能匹配pattern，则返回None
re.search从字符串任意位置开始匹配pattern，若找到则返回MatchObject, 否则返回None

```
>>> a1=re.match('bcd', '1sdfgbcd')
>>> a1
>>> a1.group(0)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'NoneType' object has no attribute 'group'
>>> a1 is None
True
>>> a2=re.search('bcd', '1sdfgbcd')
>>> a2
<_sre.SRE_Match object at 0x101c91ac0>
>>> a2.group(0)
'bcd'
>>> 
```

但是字符串中若有多个符合pattern的字符，search只会返回遇到的第一个

```
>>> re.match('X', 'A\nB\nX', re.MULTILINE)
>>> re.search('X', 'A\nB\nX', re.MULTILINE)
<_sre.SRE_Match object at 0x101cd07e8>
>>>
```

**re.MULTILINE** re的行扩展模式

re.findall 不返回重复的匹配项目，已经匹配过的字符，不会重新计入后续字符的模式匹配中

```
>>> re.findall(' s.*? s', "The sixth sick sheikh's sixth sheep's sick.")
[' sixth s', " sheikh's s", " sheep's s"]
```

zip()  使用指定的list作为字典的键和值，建立字典

```
>>> a = [1, 2, 3]
>>> b = ['j', 'v', 'm']
>>> dic = dict(zip(a, b))
>>> dic
{1: 'j', 2: 'v', 3: 'm'}
```

####模块运行分析

 - **timeit**  a more efficient module for code performance measurements
 - **profile** similar to timeit, but with a more comprehensive result 结果可读性更高
 - **trace** a module that can provide coverage analysis 可以提供覆盖率分析

####有通用价值的模块
 - **itertools**  used for operating iterable objects
  * `itertools.permutations(itreable, n)` 获取指定iterable的n个元素的全排列，返回generator，若n未提供，默认为len(iterable)
  * `itertools.product(iterable1, iterable2)` 返回两个序列的笛卡尔积，类型为generator
  * `itertools.combinations(iterable, n)` 返回iterable中任意n个元素组合的generator，组合内元素顺序无关
  * `itertools.groupby(iterable, lambda)` 将按指定条件排过序的序列分组


**logging** provides a set of tools managing one or more central log
**getopt** optparse    used for processing parameters of Python script
**optparse** is newer, more efficient and easier
**cmd**  enables you to write a command line interpreter in which you can define your own commands. A personal specific prompt



Exploring modules use dir, examine the __all__ variable, and use help

fileinput: A module that makes it easy to interate over the lines of several files or streams.

shelve: A module for creating a persistent mapping, which stores its contents in a database with a given name.



with help the user to manage files, returns a fileobject and automatically call the close method at the end of the with block

with open('d:\\somefile.txt') as f:
    print type(f)



If you want to make sure your file is closed, even if something goes wrong, you can use the with statement.

file contents can be iterated directly:
```
for line in open(filename):
    process(line)
```

python中整型与float比较时，float会被round up，需要将整型转为float再做比较

注意直接用list转化string，会转化为单个字符的list

```
>>> list('guttagonol')
['g', 'u', 't', 't', 'a', 'g', 'o', 'n', 'o', 'l']
```

直接加[]才会是整个string的list
```
>>> ['guttagonol']
['guttagonol']
```


对已经import的模块进行修改后，需要重新导入时，要使用reload()函数。

swap  
`a, b = b, a`


####Python的类
类的构造函数\_\_init\_\_ 被实例化之后即执行
Python 支持多重继承，在类定义中用逗号分隔列出多个父类即可

习惯上，任何Python类方法的第一个参数(对当前实例的引用)都叫做self。

定义包括\_\_init\_\_的类方法时，需要将self作为第一个参数列出
在子类中调用父类方法时，要显式列出self
类外调用方法时不需要写出self

子类重定义\_\_init\_\_方法时，必须显式调用父类的\_\_init\_\_方法(若父类定义过\_\_init\_\_)，防止继承出错  

创建一个类的实例只需像函数一样调用类，指定需要的参数即可

When two classes share some common behavior, it's probably better to create a generic superclass that both classes can inherit.

旧式类和新式类：为了统一type和class
类的实例的type方法返回结果也是类名，而非<type ‘instance'>

####python的json模块
json.load()参数为file_object.read()返回的类似文件类的对象
json.loads()参数可以是包含JSON文本的字符串或unicode对象

Python 2.7+版本中，标准库中有simplejson包，作用与json包类似，但是效率更高。在3.0+版本中，已经与json包合并，直接使用json包即可。

JSON数据格式是基于文本的，JSON数据中所有的值都是大小写敏感的，即值是区分大小写的
JSON允许在值直接存在任意数量的空白(空格、制表符、回车、换行等)
JSON必须使用Unicode编码
JSON原生支持的数据类型中不包括byte，因此json模块直接转化含有byte类型数据的字典时，会产生转换错误；而读取含有byte类型的数据时，也无法直接解析该数据为正确的内容

json.dumps default参数，设置自定义的序列化函数，默认传入None时，只会返回TypeError P419
json.loads object_hood参数，设置自定义的反序列化函数，通过对象的__class__属性进行操作(必须是使用对应的序列化函数进行序列化的，包含__class__键名的json字符串)，优先级低于作用类似的object_pairs_hook


python property(fget, fset, fdel, doc)
封装属性，定义get、set、del等方法，使方法可以通过类似属性的方式被调用或赋值

```
class Student(object):
    def __init__(self):
        self._score = 0

    @property
    def score(self):
        return self._score
    @score.setter
    def score(self, value):
        if not isinstance(value, int):
            raise ValueError('score must be an integer!')
        if value < 0 or value > 100:
            raise ValueError('score must be 0~100!')
        self._score = value

sa = Student()
sa.score
>>> 0
sa.score = 42
sa.score
>>> 42
```

对象属于内存，类型属于编译器

#####immutable类型
python中的不可更改对象包括strings, tuples和numbers
不可更改对象被子方法引用时会创建新的对象，可更改对象则会生成对源对象的引用。


#####reduce方法
类似map，对第二个参数的每个元素分别应用第一个参数定义的方法，方法限定为有两个参数，从参数数组的第三个元素开始，使用前次的方法执行结果与下一个元素执行方法。

```
reduce(lambda x, y: x+y, [1, 2, 3, 4, 5]) ==> ((((1+2)+3)+4)+5)
b = lambda n: reduce(lambda x,y: x*y, range(1, n, 2))
```

####关于datetime

```
>>> a=datetime.datetime(2016,01,01)
>>> 
>>> b=datetime.datetime.now()
>>> b-a
datetime.timedelta(59, 76777, 441166)
>>> c=b-a
>>> type(c)
<type 'datetime.timedelta'>
>>> dir(c)
['__abs__', '__add__', '__class__', '__delattr__', '__div__', '__doc__', '__eq__', '__floordiv__', '__format__', '__ge__', '__getattribute__', '__gt__', '__hash__', '__init__', '__le__', '__lt__', '__mul__', '__ne__', '__neg__', '__new__', '__nonzero__', '__pos__', '__radd__', '__rdiv__', '__reduce__', '__reduce_ex__', '__repr__', '__rfloordiv__', '__rmul__', '__rsub__', '__setattr__', '__sizeof__', '__str__', '__sub__', '__subclasshook__', 'days', 'max', 'microseconds', 'min', 'resolution', 'seconds', 'total_seconds']
>>> c.days
59
>>> 
```

####去重复并保持原顺序
除了set和遍历，还有一个方法，适用于2.7和3.0+版本
用list类的sort方法
```
l1 = ['b','c','d','b','c','a','a']
l2 = list(set(l1))
l2.sort(key=l1.index)
print l2
```

也可以这样写
```
l1 = ['b','c','d','b','c','a','a']
l2 = sorted(set(l1),key=l1.index)
print l2
```

####装饰器
a decorator must accept a function as an argument

http://stackoverflow.com/questions/739654/how-can-i-make-a-chain-of-function-decorators-in-python/1594484#1594484

http://stackoverflow.com/questions/13857/can-you-explain-closures-as-they-relate-to-python

#####对象与闭包的区别
Objects are data with methods attached, closures are functions with data attached.  
在动态函数中使用外部参数值的技术成为闭包 closures

被decorator修饰的函数，传入decorator的是被修饰的函数对象，而非执行结果。

```
def addSpan(fn):
    def n(*args):
        print "spam, spam, spam"
        return fn(*args)
    return n

@addSpan
def useful(a, b):
    print a**2 + b**2

def synonym(a, b):
    print a**2 + b**2

if __name__ == '__main__':
    useful(3, 4)
    addSpan(synonym)(3, 4)
```


####单例模式
类实例化对象时，先调用\_\_new\_\_，然后调用\_\_init\_\_，\_\_new\_\_中判断类变量存在已创建的实例，则不创建新的实例，只返回旧实例

```
class A(object):
    _dict = {}
    def __new__(cls):
        if 'key' in A._dict:
            print 'Exists'
            return A._dict['key']
        else:
            print 'New'
            return super(A, cls).__new__(cls)
    def __init__(self):
        print "Init"
        A._dict['key'] = self
        print ''

if __name__ == "__main__":
    a1 = A()
    a2 = A()
    a3 = A()
```

#####@staticmethod/@classmethod
都是用来修饰类的内部方法，不同的是classmethod接收的第一个参数是类本身，可以通过这个参数调用类内的非绑定方法。而staticmethod的参数则没有限制，可以任意设置。

两者都接受以非绑定的方式被直接调用，而普通的类内方法，则不能以A.func()的方式被调用，需要通过实例调用，传入self参数。

在普通的类方法中，self参数代表实例本身。

```
class B(object):
    @staticmethod
    def static(a, b):
        print "static"
        print a
        print b

    def norm_funct(self, a, b):
        print "norm"
        print a
        print b

    @classmethod
    def cls_func(cls, a, b):
        print "cls_func"
        print cls.static("inner", 'cls=>static')
        print a
        print b

>>> B.static(7, 8)
static
7
8
>>> B.norm_funct(9, 10)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: unbound method norm_funct() must be called with B instance as first argument (got int instance instead)
>>> B.cls_func(4,5)
cls_func
static
inner
cls=>static
None
4
5
>>> 
```

装饰器内部方法需要返回被修饰方法执行结果，保证被调用逻辑正常(如果需要被修饰方法的返回值时)

####multiprocessing
使用multiprocessing包的Pool时，Pool实例的第一个参数，进程池的大小，定义的是允许同时运行的最多进程个数，maxtasksperchild则定义的是同一个进程可以被重用的次数。

####glob模块
可在文件名中使用通配符
glob.glob(os.path.abs(os.path.expanduser('~/*.py*')))

os.stat(path) 返回包含文件大小、修改时间等的对象

os.path.realpath() 类似os.path.abspath

###Dive into Python3笔记

####格式说明符 format specifier
`'{0: .1f} {1}'.format(...)`

`'1MB = 1000{0.modules[humansize].SUFFIXES[1000][0]}'.format(sys)`

format位置标识符里使用字典时，数字类型的键与字符串类型的键都不需要加引号

s1.splitlines() 根据换行符分割字符串 2/3通用

####bytes类型
```
>>> b'SSS'.decode('utf-8')
'SSS'
>>> 'SSS'.encode('utf-8')
b'SSS'
>>>
```
bytes -> string bytes.decode()
string -> bytes string.encode()

代码编码指示必须写在文件的第一或第二行  
格式需要满足正则表达式 `"^[ \t\v]*#.*?coding[:=][ \t]*([-_.a-zA-Z0-9]+)"`  
前两行之外的编码标识会被编译器忽略  
官方推荐的两种写法：

```
# coding=<encoding name>
# -*- coding: <encoding name> -*-
```


#####松散正则表达式 re.VERBOSE
允许在正则表达式中换行和添加注释
忽略正则表达式中的空白、制表符和换行符

```
pattern = '''
    ^  # beginning of string
    M{0,3}  # thousands - 0 to 3 Ms
    (CM|CD|D?C{0,3})  # hundreds - 900 (CM), 400 (CD), 0-300 (0 to 3 Cs),
                      # or 500-800 (D, followed by 0 to 3 Cs)
    (XC|XL|L?X{0,3})  # tens - 90 (XC), 40 (XL), 0-30(0 to 3 Xs),
                      # or 50-80 (L, followed by 0 to 3 Xs)
    (IX|IV|V?I{0,3})  # ones - 9 (IX), 4 (IV), 0-3 (0 to 3 Is),
                      # or 5-8 (V, followed by 0 to 3 Is)
    $  # end of string
'''

>>> re.search(pattern, 'M', re.VERBOSE)
```

####文件操作
open函数的encoding参数，只有python3中存在，在2.7+中，open方法的的kwargs参数中没有encoding

在Python中，路径中使用斜杠"/"永远是正确的，即使是在Windows下

open函数返回一个流对象（streaming object）
无论何时，打开文件时指定encoding参数
file.seek() file.tell()以字节计数，read()则是以字符的个数计数，这就造成了如果文件内容是双字节字符，read方法与tell方法的计数可能不同
而且如果指定从双字节字符的中间位置开始读取，还可能直接出错，UnicodeDecodeError
即使已经读取到文件末尾，file.read()方法被重新调用时也不会出错，只会返回空字符串



\_\_iter\_\_方法提供遍历方式，返回一个生成器，generator对象被遍历时会自动调用\_\_next\_\_方法
使用for循环遍历generator对象时，会处理StopIteration异常，因此可以优雅的结束遍历

生成器表达式 语法类似list comprehension，但使用圆括号，返回generator而不是普通的列表  
`gen = (ord(c) for c in s1)`


python3.1开始，格式化标识符中可以省略索引数字，format方法会自动根据字符串中的{}位置，填入相应的参数

```
>>> "Belive {} or {}, it's {}.".format('it', 'not', 'True')
"Belive it or not, it's True."
>>>
```

####unittest模块的重要性
针对不停变换的需求(客户不清晰的描述、逐渐明确的要求等)，详细的单元测试不仅仅可以保证代码质量，更可以作为为需求变更后的回归测试

完整的单元测试可以帮助证明重构未影响代码功能，单元测试令你在进行大规模重构时充满自信


####字符只是一种抽象
文件中并不存在字符串，它们由字节组成，只有当你告诉Python使用何种编码方式能够将字节流转换为字符串，从文件中读取”字符串“才成为可能。
反之写入字符串也是一样，Python需要制定如何将字符串转换为字节序列。
只是在这个过程中，如果字节流与字符串直接的转换方式未指定，Python会使用默认编码方式(视操作系统而定)进行转换，但默认编码有时不是正确的转换方式，于是产生乱码。

在Python3中，以'b'方式打开的文件，返回的流对象没有encoding属性
以'b'方式打开的文件，seek()、tell()和read()方法的字符个数计数直接以字节计数，因此是统一的

#####非文件来源的流对象
只要包含read()方法，使用可选参数size并返回一个"串"的对象，都可以视为流对象，使用with上下文管理

 - 内存中的字符串  使用io.StringIO()转化为流对象
 - 外部网页 urlopen返回的对象
 - 处理压缩文件 gzip、tarfile库的read()方法返回的都可以视作流对象

#####标准输入、输出、错误
sys.stdin, sys.stdout, sys.stderr
这三个都是流对象
可以被覆盖指向某个文件或对象
sys.stdout, sys.stderr都只支持写入，调用他们的read()方法会报错IOError

一行with语句也可以包括多个流对象
with语句生成的上下文环境也可以不赋给一个变量，即在with语句中不使用as指定变量
with open('out.log', mode='w', encoding='utf-8') as ofs, RedirectStdoutTo(ofs):
    print("B")

任何类中只要定义了__enter__和__exit__方法，就可以变成上下文管理器，通过with进行上下文管理

####XML处理
xml文档的第一个标签，可以被视为xml文档的根元素
根元素之前的字符编码信息，不被视为xml标签
<?xml version='1.0' encoding='utf-8'?>

XPath 一种用于查询xml文档的W3C标准

Python2中由C写的pickle模块和Python写的pickle模块，在Python3中已经合并为一个pickle模块

WSGI

####模块引用方式的改变
Python3中，所有的import默认都使用绝对路径，即只从sys.path中指定的目录搜索，如果sys.path不包含当前目录，则找不到模块，如果sys.path中排在前面的目录中有排在后面的目录的同名模块，则会引用排在前面的目录的模块
只有特定的模块名(以“.“开头)表示使用相对路径进行import

Python3中，re模块可以处理bytes字符串，但是需要定义的正则表达式也是bytes类型的

```
>>> i1 = b'rk/Versions/2.7/lib/python2.7/'
>>> re.findall('\/[A-Z]+', i1)  # 使用普通字符串形式的正则表达式匹配bytes会出错
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/Library/Frameworks/Python.framework/Versions/3.5/lib/python3.5/re.py", line 213, in findall
    return _compile(pattern, flags).findall(string)
TypeError: cannot use a string pattern on a bytes-like object
>>> re.findall(b'\/[A-Z]+', i1) # 使用bytes类型的正则表达式则可以正常匹配
[b'/V']  # 匹配到的结果仍然是bytes类型的
>>>
```

bytes类型的字符串，直接使用下标取得的是对应字符的ascii码的整数表示，要像Python2里那样返回字符，需要使用字符串切片实现

```
>>> i1 = b'Hello World!'
>>> i1[0]
72
>>> type(i1[0])
<class 'int'>
>>> i1[0:1]
b'H'
>>> i1[-1:]
b'!'
>>>
```

####Python3中的一些改动
python2中的int和long两种数字类型，在Python3中被统一为int
Python2中的 <> 不等比较符在Python3中不再被支持，只能使用 !=

Python2中的itertiems在3中被items替代
Python2中的cStringIO和StringIO在Python3中都被io 替代

Python2中iterator自带的next方法，在Python3中有一个独立的next公共方法起相同作用
Python2中的filter、map方法，在Python3中用途相同，但是从直接返回列表改为返回一个迭代器


在iterable对象中, l1[nonexistent_key]语句实际上调用的是l1.__missing__(nonexistent_key)内置方法

####slots
对于类的实例x，x.\_\_slots\_\_() 表示之定义特定集合的某些属性  
获取某个属性值 x.color，实际执行的代码是  `type(x).__dict__('color').__get__(x, type(x))`  
设定某个属性值 x.color = 'PapayaWhip'，实际执行的代码是  `type(x).__dict__('color').__set__(x, 'PapayaWhip')`
