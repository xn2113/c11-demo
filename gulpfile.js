
// //引入 gulp
const gulp = require('gulp')
//全局配置 因为是模块了 所以不用谢.js了
//const config = require('./config/index')
const config = require('./config')//因为这里读取的是index, 所以可以省略index
//转为pdf格式
const markdownToPdf = require('gulp-markdown-pdf')
//重命名
const rename = require('gulp-rename')
//压缩html
const htmlmin = require('gulp-htmlmin')
//热更新服务器
const connect = require('gulp-connect')
//合并文件
const concat = require('gulp-concat')
//小型webpack
const webpack = require('webpack-stream')
//压缩css
const minifycss = require('gulp-minify-css')
//给css加前缀
const autoprefixer = require('gulp-autoprefixer')
// 合并文件操作流
const merge = require('merge-stream')
//inject自动引入依赖文件
const inject = require('gulp-inject')


//处理html, 将src中的html文件输出到dist中去
gulp.task('handle:html',function(){
    gulp.src('./src/views/*/*.html')
        .pipe(gulp.dest('./dist'))
})
//执行在命令行输入: gulp handle:html


//这是一个将markdown文件编译成其他类型文件的任务
gulp.task('compile:md',function(){
    //md-> pdf
    //1.找到md文件 2 把它编译了 3 放到dist里
    //gulp.src('./markdown/md/gulp.md')
    //gulp.src('./markdown/md/*.md')//找到md文件夹下的所有的md文件
    //gulp.src('./markdown/*/*.md')//找到markdown文件夹下的文件夹下的所有的md文件
    //gulp.src(['./markdown/md/a.md','./mardown/md/b.md'])//就找着两个制定文件

    return gulp.src('./markdown/md/gulp.md')
        //.pipe(yasuo())//管道 流工具 压缩任务
        //.pipe(hebing())//合并任务
        //.pipe(...)//可以一直写下去(执行任务)
        .pipe(markdownToPdf())//将md文件编译成PDF的这个工具
        .pipe(rename({
            extname: ".html"
        }))
        .pipe(gulp.dest('./markdown/dist'))//gulp.dest() 进行输出在某个目录下
})


//压缩hltml将src中的html文件输出到dist中去
gulp.task("handle:html",function(){
    return gulp.src('./src/views/**/*.html')
                .pipe(htmlmin(config.htmloptions))
                .pipe(gulp.dest('./dist'))
})


//处理css, 合并css, 压缩css, 前缀, 输出
gulp.task('handle:css',function(){
    //1.希望可以合并多个css, 更灵活,  2.多页面灵活处理
    let streams = [] //存放多个文件流的数组
    for(const page in config.cssoptions){
        for(const file in config.cssoptions[page]){//遍历各个页面中多个打包css文件配置
            let stream = gulp.src(config.cssoptions[page][file])
                .pipe(autoprefixer({
                    browsers:['last 2 versions','Safari >0','Explorer >0','Edge>0','Opera >0','firefox>=20'],//last 2 versions-主流浏览器的最新两个版本
                    cascade: false,//是否美化属性默认值: true像这样:
                    //-webkit-transform: rotate(45deg);
                    //        transform: rotate(45deg);
                    remove: true //是否去掉不必要的前缀 默认:true
                }))
                .pipe(concat(file + '.css')) //合并文件
                .pipe(minifycss()) //压缩文件
                .pipe(rename({suffix:'.min'})) //重命名
                .pipe(gulp.dest('./dist/'+page+'/css')) //输出到对应的目录中
            streams.push(stream) //把当前文件流存储到数组中
        }
    }
    return merge(...streams) //合并多个文件流
    // ...是es6 中的展开运算符 var a = [1,2,3,4] var b = [...a,5,6,7]//b:[1,2,3,4,5,6,7]
    // var a = {x:1, y:2} var b = {z:3, ...a} // b: {x:1, y:2, z:3}
})
// gulp.task('handle:css',function(){
//     return  gulp.src('./src/stylesheets/reset.css','./src/views/index/*.css')
//                 .pipe(autoprefixer({
//                     browsers:['last 2 versions','Safari >0','Explorer >0','Edge>0','Opera >0','firefox>=20'],//last 2 versions-主流浏览器的最新两个版本
//                     cascade: false,//是否美化属性默认值: true像这样:
//                     //-webkit-transform: rotate(45deg);
//                     //        transform: rotate(45deg);
//                     remove: true //是否去掉不必要的前缀 默认:true
//                 }))
//                 .pipe(concat('index.css'))
//                 .pipe(minifycss())
//                 .pipe(rename({suffix:'.min'}))
//                 .pipe(gulp.dest('./dist/index/css'))
// })

//js
gulp.task('handle:js',function(){
    let streams = []
    for(const page in config.jsoptions){
        //判断如果入口是数组或者字符串的话就是单出口,否则是多出
        let entry = config.jsoptions[page]
        let filename = Array.isArray(entry) || ((typeof entry) === 'string') ? page : '[name]'
        let stream = gulp.src('./src/entry.js')
                         .pipe(webpack({
                             mode: 'production',
                             entry: entry,
                             output: { filename: filename+'.min.js'},
                             module: {
                                rules: [
                                    {
                                        test: /\.js$/,//对js文件进行处理
                                        loader: 'babel-loader',//使用babel-loader对其进行处理
                                        query: {
                                            presets: ['es2015'] //将es6编译一下
                                        }
                                    }
                                ] 
                             }
                         }))
                         .pipe(gulp.dest('./dist/'+page+'/js'))
                streams.push(stream)
    }
    return merge(...streams)
})

//专门给各个页面的html文件添加对应的依赖 自动化引入对应 样式 和 js文件
gulp.task('inject', function () {
    setTimeout(() => {
        config.pages.forEach(page => {
            var target = gulp.src('./dist/'+page+'/'+page+'.html');
            // It's not necessary to read the files (will speed up things), we're only after their paths:
            var sources = gulp.src(['./dist/'+page+'/js/*.js', './dist/'+page+'/css/*.css'], {read: false});
            target.pipe(inject(sources, { ignorePath: '/dist' }))
                  .pipe(gulp.dest('./dist/'+page+''));
        })
    }, 2000);  
});

//监听函数 源文件 
gulp.task("watch",function(){
    gulp.watch('./src/views/*/*.html',['handle:html','inject','reload'])
    gulp.watch('./src/**/*.scss',['handle:css','inject','reload'])
    gulp.watch('./src/**/*.js',['handle:js','inject','reload'])
    // 通配符中 *指的是儿子这一代, ** 指的是所有的后代
})

//创建热更新服务器
gulp.task('server',function(){
    connect.server(config.serveroptions)
})

//让服务器刷新的任务
gulp.task('reload', function(){
    return gulp.src("./dist/**/*.html")//让所有的html文件都重新加载一下
    .pipe(connect.reload());
})

//让环境飞一会 监听执行
gulp.task('default',['server','handle:html','handle:css','handle:js','inject','watch'])