# Golang note

## Go项目目录结构

Go项目的工作空间通过**GOPATH**指定，一个工作空间目录下包括三个子目录:

 - src 存放代码源文件的目录，内部的每一层目录表示一个包
 - pkg 第三方包的存放目录
 - bin 存放编译完成后的二进制文件

### 常用运行命令

 * `go run file_name` 直接执行go代码文件，需要内部有main函数才行
 * `go get package_name` 下载go第三方库，放在当前工作目录中
 * `go install package_dir_path` 将包编译好的二进制文件安装到系统指定的PATH路径下，供用户直接使用
 * `go build package_dir_path` 编译包，生成二进制文件，放在GOPATH目录下的bin目录中
 * `go test package_dir_path` 运行包目录下`_test.go`结尾的测试文件，进行功能测试
 * `go get remote_package` 获取远程包，放在GOPATH指定的第一个工作空间内



使用`import "包名"`的形式引入外部包

单行语句可以不写分号，多行语句如果写在同一行，需要使用分号分隔

## 变量
### 变量声明

有三种形式

 1. var 变量名 变量类型

 ```
 var name1, name2, name3 uint32;
 ```

 同时声明多个变量时，变量类型必须相同

 2. var 变量名 = 变量值  直接初始化，编译器自动判断类型

 ```
 var name1 = 50070
 var a, b = 123, "booler"
 ```

 可以用于声明+初始化多个不同类型的变量


 3. 省略var，使用 := 的形式  
 用于在循环、函数体内部给局部变量赋值，不影响变量的外部情况

 ```
 name2 := "kare"
 ```

 这种方式只能用于函数内部变量声明，而且不能用于已经声明过的变量，否则会导致编译错误

所有声明的变量必须被使用，否则会导致编译错误

下划线(\_)用于在多重赋值时表示不使用的空值，例如使用range语法返回元素和下标时

使用双引号表示字符串，单引号表示字符，与Java语法相似

##### const 常量
声明&初始化后值不能被修改的变量，用法是  
`const identifier [type] = value`

类型声明可以省略，多个相同类型的常量可以一起声明

unsafe.Sizeof 计算字符串长度的问题？  

##### iota 特殊常量
每个const关键字出现时，被重置为0，在下一个const关键字出现之前，每出现一次iota，它的值都会自动加一

#### 算术运算符
go有自加自减运算符，但是没有取整用的"//"运算符，似乎需要通过类型转换实现

#### 逻辑运算符
`&&`, `||`, `!`，与Java中的逻辑运算符相同

#### 位运算符
`&`, `|`, `^`, `<<`, `>>` 按位运算，其中左移与右移分别相当于乘以2的n次方或除以2的n次方

#### 赋值运算符
可以将等号与算术运算符和位运算符结合，构成算术操作或位操作的自赋值

#### 其他运算符
 - `&` 返回变量存储地址
 - `*` 指针变量

与C语言中的指针语法相似

#### 运算符优先级
从高到低如下：

优先级 | 运算符
7 | `^`(按位取反), `!`(逻辑非)
6 | `*`(算术乘法), `/`, `%`, `<<`, `>>`, `&`(按位与), `&^`(??)
5 | `+`, `-`, `|`
4 | `==`, `!=`, `<`, `<=`, `>=`, `>`
3 | `<-`(lambda?)
2 | `&&`(逻辑与)
1 | `逻辑或`

#### 分支语法

##### if语句
条件判断不需要写在括号内，判断内容则需要括号限定范围

```
if 条件 {
    ...
} else if 条件2 {
    ...
} else {
    ...
}
```

##### switch语句
与Java中的switch语法类型，但是每个case分支唯一，匹配项后不需要跟break

```
switch var1 {
    case val1:
        ...
    case val2:
        ...
    case val3, val4, val5:
        ...
    default:
        ...
}
```
switch语句可以不加判断条件，case表达式为true时即会被执行，相当于另一种形式的`if...else if...else`

##### select语句
类似switch，但是会随机执行一个可以运行的case分支，如果没有可运行的case分支，则会阻塞直到有case可以运行  
同样不需要写break

```
select {
    case communication clause0:
        statement(s)
    case communication clause1:
        statement(s)
    default:  // 可选
        statement(s)
}
```

有default语句则在没有可执行的case时执行default，否则会阻塞

可用于有IO交互的场景

#### 循环语句
##### for循环
有三种形式，C语言中的for用法形式、for中的while用法形式和配合range使用，遍历数组的形式

 * C语言的for形式 变量初始化、条件判断和后续自加自减操作语句不需要加括号
 
 ```
 for int; condition; post {
     ...
 }
 ```
也可以只写condition语句，效果类似while写法

 * 类似while的形式 条件判断语句不需要加括号
 
 ```
 for condition {
     ...
 }
 ```

 此时不写判断条件的话，将会是无限循环
 
 * range格式，可以对map、slice、数组、字符串等进行迭代循环

 ```
 for key, value := range oldMap {
     newMap[key] = value
 }
 ```

##### 循环控制的关键字
 * break 中断当前for循环或跳出switch语句
 * continue 跳过当前循环剩余语句，继续进行下一次循环
 * goto 跳转到被标记的语句，可以用于跳出循环体

#### 函数声明
函数声明时如果有返回值，则函数声明中必须写明返回值的类型，函数可同时返回多个值，此时也需要在声明时写明所有返回值的类型，声明多个返回值类型时，需要使用括号围起全部类型声明，防止语法解析错误

函数返回值可以有多个

```
func func_name([parameter list]) ([return_types]) {
    ...
}
```

传递参数时有值传递和引用传递两种形式，引用传递会将实参的引用直接传给形参，造成形参的改变影响实参，因此一般使用值传递的方式传递函数的参数

Go支持匿名函数，可以作为*闭包*  
匿名函数可以作为函数的返回值使用，也可以直接赋给某个变量，以正常方式声明的函数，也可以直接赋给某个变量，在通过调用变量被调用

匿名函数赋值语法

```
variable_nm := func() {
    ...
}
```

定义在main函数和其他子函数体外的变量，视作全局变量

###### 变量声明后的默认值
类型 | 默认值
:------ | :------
int | 0
float32 | 0
pointer | nil

#### 数组
数组用来存储统一类型的多个数据  
只声明数组而不做初始化时需要指定数组长度:  
`var variable_name [SIZE] variable_type`

如果声明数组与初始化在统一语句完成，可以不指定长度，程序根据初始化时的值自动设置数组大小，使用大括号包围初始化的值  
`var variable_name = [...]variable_type{a, b, c, d, ...}`

数组元素的调用与赋值语法和C中数组的使用方式相同

多维数组的声明方式  
`var variable_name [dimension1][dimension2]...[dimensionN] variable_type`

多维数组初始化方式与一维数组类似，不同维度分别用大括号隔开

数组作为形参出现在函数参数中时，在函数声明中可以不指定长度

#### 指针
用于存储&取到的变量内存地址的变量，用`*variable_name`的形式指向该内存地址存储的变量  
声明指针变量时，不需要指定指针变量的类型，而是需要声明所指向地址存储的数据的类型    
`var var_name *var_type`

未初始化的指针变量的值是nil  
指针类型也可以用于定义数组使用

向函数中传递指针变量，函数将可以直接操作定义在函数外部的值，对他们进行改变

####结构体
数组可以存储同一类型的数据，而结构体可以存储不同类型的数据  
结构体的声明需要使用type和struct两个关键字，其中，struct定义了一个新的数据类型，type语句设定结构体的名称  
从struct语句的角度来看，结构体声明语句的形式与变量声明类似，只是用的是type而不是var关键字  

```
type struct_type_name struct {
    member type_definition;
    member type_definition;
    ...
    member type_definition;
}
```

结构体内部成员声明语句最后的分号，也可以不写，但是不能写成逗号  

结构体变量初始化的语法和数组初始化类似：  
`struct_variable_name := struct_variable_type {value1, value2, ..., valueN}`

可以通过"."号访问结构体内部的成员:  
`struct_variable_name.member = newValue`

对于指向结构体的指针变量，可以直接使用结构体指针访问结构体的成员:  
`struct_pointer.member`

而不能以`*struct_pointer.member`的形式

#### 切片
切片是对Go中数组的抽象，类似动态数组，长度可变  
声明方式:  
`var identifier []name` 不需要指定大小  
或使用make()函数:  
`var slice_name = make([]type, len[, capacity])`  
其中capacity定义切片的最大长度  
make函数生成的切片会被填充上默认值，生成后不会是nil

切片可以使用数组初始化，也可以使用数组切片的方式初始化

 - `slice_name = []int {1, 2, 3}`  使用数组进行初始化
 - `slice_name = array1[startIndex: endIndex]`  使用数组切片进行初始化

数组切片的范围包括startIndex，但是不包括endIndex，右开放区间，省略index时默认使用数组起始或数组末尾  
与Python的数组切片不同，切片末尾没有-1、-2这样的写法

`len(slice_name)`函数可以取得切片的长度，也可用于获取定长的数组的长度  
`cap(slice_name)`函数用于获取切片的最大长度  

切片在被声明后，未初始化之前的值是nil  
切片本身也可以通过`[startIndex: endIndex]`的形式截取部分长度  

`append(slice_name, value[, value2, value3,...])` 向切片末尾添加一个或多个元素，返回新的切片而不是直接改变原切片的值  
`copy(dest_slice, src_slice)` 将源切片复制到目标切片

#### 集合(map)
map是无序的键值对集合，使用hash表实现，可以通过range进行遍历，但是返回内部元素的顺序无法保证

可以通过map关键字声明map，也可以使用make函数定义  
`var map_variable_name [key_data_type]value_data_type`  
或者  
`map_variable_name := make(map[key_data_type]value_data_type)`

未初始化的map是一个nil map，不能被用来存放键值对

直接查找map中的某个key，会返回值和值是否存在的变量，变量为true表示该key在map中存在  
`value, existence := map_variable_name[key_variable_name]`

`delete(map_variable_name, key_variable_name)` 用于从map中删除指定的key

#### 类型转换
`type_name(expression)` 变量类型强转

Go中，不同类型的数值变量，无法直接进行数学运算

#### 接口
Go语言的一种数据结构，将不同的函数与不同的结构体绑定，然后将这些函数记录在接口声明中，作为接口实例的方法供集中调用

声明方式：

```
/* 定义接口 */
type interface_name interface {
    method_name1 [return_type]
    method_name2 [return_type]
    ...
    method_nameN [return_type]
}

/* 定义结构体 用于不同数据类型？ */
type struct_name1 struct {
    ...
}

/* 实现绑定到结构体的接口方法 */
func (struct_name_variable struct_name) method_name1() [return_type] {
    ...
}

...
```

用途不明，疑似定义了类的概念，又似是而非

使用时通过创建接口实例，再由接口实例调用声明过的函数

```
type Phone interface {
    call()
}

type Nokia struct {
}

func (nokiaPhone Nokia) call() {
    fmt.Println("Connect people.")
}

...

var phone Phone
phone = new(Nokia)
phone.call()
```

#### error接口
自定义的error接口

```
type error interface {
    Error() string
}
```

有错误处理的包，在处理接口绑定的方法产生的异常时，会去调用接口绑定的Error()方法，这时就会使用自定义的Error()函数

自定义error示例

```
type errStruct struct {[...]}

func (err errStruct) Error() [string] {
    ...
    fmt.Printf("Error occured at %v", time.Now())
}
```

### 并发
#### goroutine
使用"go"关键字开启一个新的goroutine运行函数，语法:  
`go func1(x, y)`

#### channel
channel是有类型的管道，可以使用"<-"符号对其发送或接收值:  
`ch <- v` 将v送入channel ch  
`v := <- ch` 从channel ch接收值，赋给变量v
可以理解为箭头就是数据流的方向

channel使用时必须使用make函数初始化  
`ch = make(chan variable_type)`

默认情况下，无论是写入channel还是从channel接收数据，如果另一端没有准备好，则发送和接收操作都会阻塞，这样可以保证不同的goroutine在没有明确的锁或状态竞争变量的情况下进行同步

##### hannel状态
可以通过赋值操作的第二个返回值，检查channel是否已经被关闭  
`v, ok := <- ch` ok为true表示channel正常，为false表示channel已被关闭

可以使用`close(ch)`函数关闭channel，之后返回的第二个值会变成false

可以使用range不断从channel接收数据，直到channel被关闭:

``` go
for v := range ch {
    ...
}
```

**注意:**

 * 只有发送者可以关闭channel，接受者不能。向一个已经关闭的channel发送数据会引起panic
 * channel与文件不同，通常不需要关闭，只有当需要向接收者表示没有数据要发送时才需要关闭

##### 缓冲channel
channel也可以带缓冲空间，初始化时make函数的第二个参数，表示channel的缓冲长度  
`ch := make(chan byte, 100)`

向缓冲channel发送数据时，只有缓冲区满的时候才会阻塞，反过来，从缓冲channel读取数据时，如果channel为空，则此时读取操作也会阻塞

##### select
select可以让一个goroutine在多个channel上等待，阻塞直到某个channel可以继续执行为止  
或者也可以设置select的default选项，定义其他通讯都阻塞时的默认操作，而不是阻塞执行

#### 互斥锁
锁定一个共享变量，只有当前gorountine允许访问，`sync.Mutex`类型的`Lock`和`Unlock`两个方法可以锁定变量/在使用之后解锁变量

使用示例:

```
sync.Mutex.Lock()
map1["key1"]++
sync.Mutex.Unlock()
```


对于可能被锁定的变量，可以使用defer来保证使用变量时该变量已被解锁

使用示例:

```
func getValue(key string) int {
    sync.Mutex.Lock()
    // 变量v2被设定值之后，函数返回，才会执行被defer的语句
    defer sync.Mutex.Unlock()
    v2 := map1["key1"]
}
```

#### defer
延迟语句的执行直到上层函数返回  
`defer statement1`

##### defer栈
同一个函数中有多个defer操作时，被defer的操作会在函数返回时，按照**后进先出**的顺序被延迟执行的函数调用

#### panic
作用类似Java中的throw和Python中的raise，抛出一个异常，终止当前程序的执行  
panic接收一个任意类型的实参，一般是字符串，在程序终止时打印这个参数

panic单纯抛出异常，而没有对异常作出对应的处理

#### recover
panic被调用后，程序中止当前函数的执行，开始回溯goroutine的栈，运行存储在栈中的被推迟执行(如defer)的函数；而如果回溯到goroutine栈的顶端，程序运行就会终止  
在这个过程中，可以通过在被推迟的函数中调用`recover()`函数，来继续执行由于panic而被中止的函数  

调用recover将停止回溯过程，并返回panic被调用时传入的实参  
由于回溯对象只能是被推迟执行的函数，因此recover要想起到恢复panic引起的中断的作用，只有写在被推迟执行的函数中才可以

recover的一个作用就是在服务器中终止执行失败的goroutine而无需停止其他的goroutine

#### new
内置函数，用于分配一个类型需要的内存，`new(X)`和`&X{}`是等效的  
初始化结构体时，`&X{}`的写法更易读一些

#### 空接口
没有实现任何方法的接口称为空接口  
使用接口时都是隐式转换，所以每种接口都实现了空接口的条约

`.(TYPE)`形式可以将空接口转换成指定的类型  
`a.(string)`

定义在函数参数列表中的空接口，可以在静态语言中实现函数的动态类型接口

```
func append(a interface{}, b interface{}) interface() {
    append(a.([]int), b.(int))
    ...
    append(a.([]float32), b.(float32))
    ...
}
```
