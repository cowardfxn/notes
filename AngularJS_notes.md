
创建controller和filter时可以定义额外的service依赖关系

```
app.service("hexafy", function () {
    this.myFunc = function (x) {
        return x.toString(16);
    }
});

app.controller("myCtrl", function ($scope, hexafy) {
    $scope.hex = hexafy.myFunc(255);
});

// filter usage
app.filter("myFilter", function ['hexafy', function (hexafy) {
    return function(x) {
        return hexafy.myFunc(x);
    }
}]);

<!-- HTML implementation -->
<ul>
    <li np-repeate="x in counts">{{x | myFormat}}</li>
</ul>
```

AngularJS自带服务: $location, $timeout, $interval, $http

应用$http服务时，需要在controller定义中引用
http请求有get、post、put、delete、head、jsonp、patch等方法  
使用then(successFunc, errorFunc)的方式处理正常情况和异常情况

```
app.controller("myController", function ($scope, $http) {
    $http.get({
        method: "GET", 
        url: "/req01"
    }).then(function successCallback(response) {
        ...
    }, function errorCallback(response) {
        ...
    });
});
```

误 Angular 绑定的HTML元素似乎无法直接交互，数据传递引用必须必须通过controller

select元素中，ng-init定义select默认选项，ng-model定义select引用ID，ng-options使用for循环语句定义可用的option选项的显示值  
也可以在options标签中定义np-repeat定义选项  
二者的区别是，ng-repeat直接构造html元素文本，后续引用取到的也只会是HTML对象或字符串直接量，而使用ng-options定义的select，在AngularJS中取到的值也可以是设置options中的对象

```
<select ng-model="selectSite" ng-options="x.site for x in sites" ng-init="selectSite=sites[0]"></select>

<h1>Selected {{selectSite.site}}</h1>
<p>Target URL: {{}selectSite.url}</p>

<!-- 类似sites数组的ng-repeats遍历方式 -->
<select ng-model="selectSite2" ng-init="selectSite2=sites[0].url">
    <options ng-repeat="e for e in sites" value="{{e.url}}">{{e.site}}</options>
</select>

<h1>Selected {{selectSite2}}</h1>  <!-- 此时无法直接取得select的显示字符串，只能取到值 -->
```

其中，ng-init也可以在controller中直接给$scope中的select元素对应model名赋值来实现

```
app.controller("myController", function ($scope) {
    ...
    $scope.selectSite = $scope.sites[0]; // ng-options时
    $scope.selectSite2 = $scope.sites[1].url; // ng-repeat时
});
```

AngularJS中直接定义的HTML元素属性，见名知意 ng-disabled, ng-show, ng-hide, ng-click等等  
ng-bind 绑定动态方法到HTML元素，作为元素的显示字符  
ng-if 对应表达式为false时，从DOM中移除绑定的元素

ng-include属性 直接引入html文件

跨域引用时需要设置域名访问白名单

```
<script>
var app = angular.module("myApp", []);
app.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'https://external.domain/path1/*'
    ]);
});
</script>
```

此外，还需要在*服务端*设置允许跨域访问

`header('Access-Control-Allow-Origin:*');`


app.directive  添加指令

在加载HTML页面时，AngularJS插件和相应的module、controller定义代码需要在页面元素加载之前加载，因此需要放在header中或者body最前面

AngularJS绑定HTML元素使用ng-model属性，ng-model所指向的目标对象也可以是另一个对象的一个属性

```
<form>
    User: <input type="text" ng-model="user.name"/>
    Password: <input type="password" ng-model="user.password"/>
</form>
```

form元素的novalid用于关闭浏览器的默认验证

AngularJS对象的属性验证，

属性 | 含义
:-------- | :---------
$dirty | 绑定的HTML元素是否有输入
$valid | email、currency等类型输入是否合法
$invalid | 对应类型的输入是否无效
$prisine | 表单(form)没有填写记录

AngularJS也提供了动画效果库，使用ng-animate/ngAnimate模块引用

angular.fromJson()  JSON对象to字符串
angular.toJson() 字符串to JSON对象
