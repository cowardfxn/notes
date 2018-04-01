# ES6 标准入门

#### 字符串的扩展
正则表达式类定义

```
let regPtr = new Regex('a[b|c]', 'ig');  
```

`Regex`类参数顺序，正则表达式字符串，正则表达式控制标识符(全局、忽略大小写等)

#### 列表的扩展
列表和对象元素都支持多重赋值

```
let [a, [b], c] = [1, [2, 3, 4], 5];
console.log(`${a}, ${b}, ${c}`); // 1, 2, 5

let obj1 = {'a': '01', 'b': '03', 'c': 'C'};
for (let [k, v] of obj1) {
    console.log(`field ${k}: ${v}`);
}

// 同样适用于对象
let { d, g } = {
    'd': 'DD',
    'nested': {
        'e': 'Nested_e',
        'twice_nested': {
            'f': "FF",
            'f2': 123455
        }
    },
    'g': 'GG'
}
console.log([d, e, f, g].toString());
```

es6增加了iterator的概念，具有指向下一个元素的`next`方法的对象就是Iterator对象  
并新增了遍历Iterator对象的`for ... of`语法

#### 对象的扩展
对象声明时可以直接以变量的名称作为属性名，变量的值作为属性值

```
let [a, b, e, ...c] = [1, 2, 4, 5, 6, 8, 9];
let obj1 = {
    a,
    b,
    e,
    c
}
console.log(obj1);
// { a: 1, b: 2, e: 4, c: [ 5, 6, 8, 9 ] }
```
这个特性不支持使用直接值声明对象

```
let o1 = { 'a', 'b' }  // 不能识别的语法错误
let o2 = { a, b }  // 抛出变量a未定义错误
```

这种特性适用于定义包含变量值或具名函数的对象

```
module.exports = { func1, func2, func3 }
```

简洁表示法和冒号写法可以在声明对象时混用

#### 函数的扩展
es6支持定义具有默认值的函数  
有默认值的参数需要定义在参数列表的末尾

```
function func1(a, b=555, c={}) {
    ...
}
```

新增name属性，指向函数名称

```
function nono() {
    return;
}
console.log(nono.name);
```

也可以通过`...`实现动态参数定义

```
function dynamicArgs(...args) {
    console.log(`Received ${args.length} params.\nThey are ${JSON.stringify(args.toString())}`);
    console.log(args)
}

dynamicArgs(1, 3, 5, 6);
// Received 4 params.
// They are "1,3,5,6"
// [ 1, 3, 5, 6 ]
dynamicArgs(['a']);
// Received 1 params.
// They are "a"
// [ [ 'a' ] ]  array as single parameter
dynamicArgs({'a1': 1, 'b1': 'b', 'c': {'c1': 2, 'c2': 5}});
// Received 1 params.
// They are "[object Object]"
// [ { a1: 1, b1: 'b', c: { c1: 2, c2: 5 } } ]
```

es6对回调函数的递归调用情况也做了优化，内存中只会保存直接调用回调函数的上层函数，不再缓存整个回调函数的其他间接调用栈

es6增加了箭头(`() => {}`)声明函数的语法  
在箭头方式声明的函数中，*this*关键字指向的是当前函数和声明箭头函数的函数范围(箭头函数直接声明在模块中则是模块范围内)  
与之相比，*function*方式声明的函数，内部的*this*则指向整个进程的运行空间，有内存泄露的风险

#### Rest语法
使用三个点号`...`来表示列表中的其余元素的集合，使用时必须放在末尾

#### 关于lint
对于es6，可以使用eslint和*airbnb*的lint规则

首先安装ESLint和Aribnb语法规则

```
npm i eslint
npm i eslint-config-airbnb
```

在项目根目录下的`.eslintrc`文件中定义如下配置：

```
{
    "extends": "eslint-config-airbnb"
}
```

使用eslint检查单个代码文件  
`eslint index.js`


es6添加了class语法，可以用来替代原本的prototpye语法

#### Map结构
es6添加了新的Map结构，语法类似Python中的dict

```
let m1 = new Map([['a', 321], ['b', '345'], ['c', 'WW']]);
console.log(m1)
// Map { 'a' => 321, 'b' => '345', 'c' => 'WW' }

for (let [k, v] of m1) {
    console.log(k, v);
}
// a 321
// b 345
// c WW
```

Map的`keys()`，`values()`和`entries()`方法分别返回键名，键值和键值对对象，可用于遍历Map对象

Map对象的取值和赋值都要通过get、set方法进行，无法像对象那样通过点号或中括号语法实现
