# GraphQL notes

[中文文档](http://graphql.cn/learn/queries/#variables)

每个类型的每个字段都由一个resolver函数支持，该函数由GraphQL服务器开发人员提供
每当一个字段被执行时，相应的resolver被调用以产生下一个值

如果字段产生标量值，则执行完成；如果产生的是一个对象，则该查询将继续执行该对象对应字段的解析器，直到生成标量值
GraphQL的查询始终以标量值结束

#### 变量
GraphQL查询时，如果需要传入变量，则变量需要在声明之后才能在查询中使用

```
query HeroNameAndFriends($episode: Episode = "JEDI") {
    hero(episode: $episode) {
        name
        friends {
            name
        }
    }
}

// 在其他代码中
{
    episode: "NEWHOPE"
}
```

在query *HeroNameAndFriends*中声明了外部变量episode，然后外部变量才能在内部的hero查询中作为参数使用
#### 内省
`__schema`  查询schema支持的查询类型

以双划线开头的type都属于内省系统

```
{
    __type(name: "Droid") {
        name
        fields {
            name
            type {
                name
                kind
                ofType {
                    name
                    kind
                }
            }
        }
        description
    }
}
```

*description* 向内省系统请求文档

### Schema

#### 构成

模块 | 说明
:---- | :----
schema | GraphQL中schema的描述
query | 定义只读的取数据操作
mutation | 写入之后抽取数据的操作
subscription | subscription操作(experimental)，监控数据变更？

#### 内置标量类型
标量是GraphQL中最基本的数据类型，由各种标量构成复杂的高级类型或自定义对象类型

GraphQL中的查询，必定以返回标量结束

数据类型 | 说明
:---- | :----
Int | 整型
Float | 浮点型
String | 字符串
Boolean | 布尔型
ID | ID类型

#### 高级类型

类型 | 说明
:---- | :----
scalar | 用于声明标量
type | 用于声明对象
interface | 用于声明接口
union | 用于声明Union类型
enum | 用于声明枚举类型对象
input | 用于声明作为输入的对象

#### 类型修饰符

语法 | 说明
:---- | :----
`String` | 可以为null的字符串类型
`String!` | 不能为null的字符串类型
`[String]` | 内部元素是可以为null的字符串的列表，列表本身的值也可以是null
`[String]!` | 内部元素是可以为null的字符串的列表，列表本身的值不能为null
`[String!]!` | 内部元素是不能为null的字符串的列表，列表本身的值也不能是null

#### 输入参数的定义语法

##### 基本声明语法
声明schema中的Query操作

```
type Query {
    users(limit: Int): [User]
}
```

###### 具有默认值的输入参数

```
type Query {
    users(limit: Int = 10): [User]
}
```
##### 具有多个参数和多种默认值

```
type Query {
    users(limit: Int = 10, sort: String): [User]
}

type Query {
    users(limit: Int, sort: String = "asc"): [User]
}

type Query {
    users(limit: Int = 10, sort: String = "asc"): [User]
}
```

#### input类型
用于定义mutation操作中的更新对象参数

```
input ListUserInput {
    limit: Int
    since_id: ID
}

type Mutation {
    users(params: ListUserInput): [User]!
}
```

#### 自定义标量
突破默认标量类型的限制，使查询可以返回复杂数据结构

```
scala Url
type User {
    name: String
    homepage: Url
}
```

#### 接口
一个对象类型可以实装多个接口

```
interface Foo {
    is_foo: Boolean
}

interface Goo {
    is_goo: Boolean
}

type Bar implements Foo {
    is_foo: Boolean
    is_bar: Boolean
}

type Baz implements Foo, Goo {
    is_foo: Boolean
    is_goo: Boolean
    is_baz: Boolean
}
```

#### Unions
定义联结后的对象作为新的类型使用

```
type Foo {
    name: String
}
type Bar {
    is_bar: Boolean
}
union SingleUnion = Foo
union MultipleUnion = Foo | Bar
type Root {
    single: SingleUnion
    multiple: MultipleUnion
}
```

#### 枚举类型

```
enum USER_STATE {
    NOT_FOUND
    ACTIVE
    INACTIVE
    SUSPENDED
}
type Root {
    stateForUser(userID: ID): USER_STATE!
    users(state: USER_STATE, limit: Int = 10): [User]
}
```
