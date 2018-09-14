
//index中要放banner 和header

//引入banner 因为banner并没有暴露一些东西给index用, 所以就用下面的方法引入进来就可以了
require('./modules/banner')
require('./modules/header')

console.log('index')