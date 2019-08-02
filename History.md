
v1.4.2 / 2019-08-02
==================

  * simplify typo
  * upgrade dependencies.

v1.4.1 / 2019-01-14
===================

  * Release v1.4.1
  * typo fix.

v1.4.0 / 2019-01-14
===================

  * Release v1.4.0
  * use FibPushNS as global namespace.
  * add lib/* to .gitignore, add npm/travis-ci badget.
  * Merge pull request #7 from richardo2016/master
  * [@types] litle fix.
  * upgrade dependency.
  * Merge pull request #6 from richardo2016/master
  * add src directory to .npmignore, fix docs/link.md

v1.3.0 / 2018-06-17
===================

  * 1.3.0
  * migrate src to typescript.
  * v1.2.2
  * Merge pull request #5 from LYP949839107/dev
  * fix:增加测试用例
  * fix:对推送空消息的情况进行分类

v1.2.1 / 2018-05-22
===================

  * v1.2.1
  * support lock/unlock.
  * enable post data into empty channel.
  * Merge pull request #4 from richardo2016/feat/readme
  * add README.md and sample code.
  * fix date compare error, v1.2.0.

v1.1.0 / 2018-04-25
===================

  * release v1.1.0
  * Merge pull request #3 from LYP949839107/dev
  * fix:修复push队列最早时间戳不返回channel

v1.0.2 / 2018-04-04
===================

  * v1.0.2
  * Merge pull request #2 from vickyjam/master
  * 优化filter实现 1.避免群发时从ws中查询 2.避免off的时候引用泄漏
  * fix 同一个ws对象多次on导致filter覆盖问题。
  * 封装channel数据发送filter方法，避免污染push内部逻辑。
  * 1.取消异常捕获 2.增加npm test script
  * v1.0.2
  * Merge branch 'master' of https://github.com/fibjs/fib-push
  * fix double bind on same channel.
  * 支持指定用户推送信息
  * 增加异常处理，防止客户端连接断开ws对象没有丢弃的问题

v1.0.0 / 2017-12-11
===================

  * init
