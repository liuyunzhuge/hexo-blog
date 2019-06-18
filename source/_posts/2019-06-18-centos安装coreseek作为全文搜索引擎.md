---
title: centos安装coreseek作为全文搜索引擎
tags:
  - 运维知识
categories:
  - 运维管理
date: 2019-06-18 22:53:43
---


coreseek是sphinx全文搜索引擎的带有中文分词的版本。目前coreseek官网已经停止访问了，不知道为啥，我这边产品还在使用着它提供检索服务，前2年记下的笔记还在，这次正好重新准备centos环境，所以在博客中再记录一遍。我安装的是coreseek3.2.14，这是它最稳定的一个版本。

<!-- more -->
## 下载coreseek3.2.14
由于它的官网没法访问了，所以现在这个源码包不是很好下载，需要多搜索一下才能找得到。

## 安装前的准备
coreseek对以下软件有版本要求：
> m4 >= 1.4.13
autoconf >= 2.65
automake >= 1.11
libtool >=2.2.6b

通过以下方式检测版本：
```bash
m4 --version && autoconf --version && automake --version && libtool --version
```
版本不满足的要求的要想办法升级。检测结果:
```bash
[root@localhost ~]# m4 --version && autoconf --version && automake --version && libtool --version
m4 (GNU M4) 1.4.16
Copyright (C) 2011 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by Rene' Seindal.
autoconf (GNU Autoconf) 2.69
Copyright (C) 2012 Free Software Foundation, Inc.
License GPLv3+/Autoconf: GNU GPL version 3 or later
<http://gnu.org/licenses/gpl.html>, <http://gnu.org/licenses/exceptions.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by David J. MacKenzie and Akim Demaille.
automake (GNU automake) 1.13.4
Copyright (C) 2013 Free Software Foundation, Inc.
License GPLv2+: GNU GPL version 2 or later <http://gnu.org/licenses/gpl-2.0.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by Tom Tromey <tromey@redhat.com>
       and Alexandre Duret-Lutz <adl@gnu.org>.
libtool (GNU libtool) 2.4.2
Written by Gordon Matzigkeit <gord@gnu.ai.mit.edu>, 1996

Copyright (C) 2011 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```
都满足要求了，可以准备继续下一步。
我已经准备好coreseek3.2.14的安装包了（下面第一个）：
```bash
[root@localhost downloads]# ll
总用量 75584
-rw-r--r--   1 root root  4150662 6月  18 21:40 coreseek-3.2.14.tar.gz
drwxrwxr-x  23 root root    20480 6月  18 21:47 git-2.9.5
-rw-r--r--   1 root root  5928730 8月  11 2017 git-2.9.5.tar.gz
drwxr-xr-x.  7 root root      251 3月  13 14:38 lnmp1.6
-rw-r--r--.  1 root root   160155 6月  14 16:34 lnmp1.6.tar.gz
-rw-r--r--   1 root root 67112960 5月  29 05:37 node-v10.16.0-linux-x64.tar
```

## 预装其它依赖的软件
```bash
yum install make gcc g++ gcc-c++ libtool autoconf automake imake mysql-devel libxml2-devel expat-devel -y
```

## 设置PATH
```bash
[root@localhost downloads]# echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin:/usr/local/git/bin:/root/bin
```
coreseek将会被安装到/usr/local目录，用以上命令检查/usr/local/bin是否包含在$PATH设置中。如果不在，则先使用下面的命令把coreseek的bin目录加入到$PATH中:
```bash
echo "export PATH=$PATH:/usr/local/coreseek/bin" >> /etc/bashrc
source /etc/bashrc
```

## 中文测试环境检查
```bash
[root@localhost downloads]# locale
LANG=zh_CN.UTF-8
LC_CTYPE=zh_CN.UTF-8
LC_NUMERIC="zh_CN.UTF-8"
LC_TIME="zh_CN.UTF-8"
LC_COLLATE="zh_CN.UTF-8"
LC_MONETARY="zh_CN.UTF-8"
LC_MESSAGES="zh_CN.UTF-8"
LC_PAPER="zh_CN.UTF-8"
LC_NAME="zh_CN.UTF-8"
LC_ADDRESS="zh_CN.UTF-8"
LC_TELEPHONE="zh_CN.UTF-8"
LC_MEASUREMENT="zh_CN.UTF-8"
LC_IDENTIFICATION="zh_CN.UTF-8"
LC_ALL=
```
要求LANG跟LC_ALL的值必须为zh_cn.UTF-8，设置方法如下：
```bash
export LC_ALL=zh_CN.UTF-8
export LANG=zh_CN.UTF-8
```

## 解压安装包
```bash
[root@localhost downloads]# tar zxf coreseek-3.2.14.tar.gz 
[root@localhost downloads]# cd coreseek-3.2.14
```
运行：
```bash
cat testpack/var/test/test.xml
```
检查前面设置的locale是否生效。

## 安装mmseg分词
记住先回到coreseek解压目录：
```bash
cd mmseg-3.2.14
./bootstrap
./configure --prefix=/usr/local/mmseg3
make && make install
```

安装完毕，运行：
```bash
/usr/local/mmseg3/bin/mmseg -d /usr/local/mmseg3/etc src/t1.txt
```

测试分词是否安装正确，正确的结果应该是：
```bash
中文/x 分/x 词/x 测试/x 
中国人/x 上海市/x 

Word Splite took: 0 ms.
```

## 检查gcc版本
```bash
gcc --version
```
结果是：
```bash
gcc (GCC) 4.8.5 20150623 (Red Hat 4.8.5-36)
Copyright © 2015 Free Software Foundation, Inc.
本程序是自由软件；请参看源代码的版权声明。本软件没有任何担保；
包括没有适销性和某一专用目的下的适用性担保。
```

coreseek在gcc大于4.7的环境，安装会出错，需要打一个补丁。下载补丁包，存放到/home/downloads目录，并解压：
```bash
cd /home/downloads
wget https://vifix.cn/blog/wp-content/uploads/2012/04/sphinxexpr.cpp_.patch_.zip
 
unzip sphinxexpr.cpp_.patch_.zip
```

打补丁方法：
```bash
[root@localhost downloads]# patch -p1 < sphinxexpr.cpp-csft-3.2.13.patch
can't find file to patch at input line 3
Perhaps you used the wrong -p or --strip option?
The text leading up to this was:
--------------------------
|--- /home/mac/tmp/sphinxexpr.cpp	2010-05-07 01:07:49.000000000 +0800
|+++ sphinxexpr.cpp	2012-04-16 13:43:22.015859399 +0800
--------------------------
File to patch: /home/downloads/coreseek-3.2.14/csft-3.2.14/src/sphinxexpr.cpp
patching file /home/downloads/coreseek-3.2.14/csft-3.2.14/src/sphinxexpr.cpp
```

关键命令：
```bash
patch -p1 < sphinxexpr.cpp-csft-3.2.13.patch
```
然后它会提示：
```bash
File to patch: 
```
输入coreseek解压目录的csft-3.2.14/src/sphinxexpr.cpp文件，也就是：/home/downloads/coreseek-3.2.14/csft-3.2.14/src/sphinxexpr.cpp。


## 安装支持mysql数据源的coreseek

在这一步之前，要确保系统上已经安装有mysql数据库，否则coreseek无法继续往后安装了。并且我们要通过下面的方法，来找到mysql.h这个头文件以及libmysqlclient.a这个库文件所在的目录，这两个目录是安装coreseek必须的。
```bash
[root@localhost mmseg-3.2.14]# find / -name mysql.h
/usr/local/mysql/include/mysql.h
/usr/local/mysql/include/mysql/mysql.h
```
mysql.h这个头文件的目录是：/usr/local/mysql/include

```bash
[root@localhost mmseg-3.2.14]# find /usr -name libmysqlclient.a
/usr/local/mysql/lib/libmysqlclient.a
```
libmysqlclient.a这个库文件的目录是：/usr/local/mysql/lib

接下来开始coreseek的安装，记得先回到coreseek解压目录：
```bash
cd ..
cd csft-3.2.14
make clean
sh buildconf.sh
./configure --prefix=/usr/local/coreseek --without-unixodbc --with-mmseg --with-mmseg-includes=/usr/local/mmseg3/include/mmseg/ --with-mmseg-libs=/usr/local/mmseg3/lib/ --with-mysql --with-mysql-includes=/usr/local/mysql/include --with-mysql-libs=/usr/local/mysql/lib
```

以上命令中，--with-mysql-includes和--with-mysql-libs需要替换为你本机上mysql.h和libmysqlclient.a两个文件所在的目录，就是上面的办法所介绍的。如果coreseek安装遇到问题，需要重新安装，make clean是必须要用的，否则第一次执行以上代码的话可以不用。

接下来不急于执行make，而是先做以下处理
```bash
vim config/config.h
```
在其中搜索USE_LIBICONV，将其后的1改为0。

接下来运行：
```bash
make && make install
```
等待安装完毕。

## 测试安装结果
准备测试，回到coreseek解压目录，然后进入testpack目录
```bash
cd ..
cd testpack
```

### 测试1
```bash
/usr/local/coreseek/bin/indexer -c etc/csft.conf
```
正确的输出：
```bash
Coreseek Fulltext 3.2 [ Sphinx 0.9.9-release (r2117)]
Copyright (c) 2007-2011,
Beijing Choice Software Technologies Inc (http://www.coreseek.com)

 using config file 'etc/csft.conf'...
total 0 reads, 0.000 sec, 0.0 kb/call avg, 0.0 msec/call avg
total 0 writes, 0.000 sec, 0.0 kb/call avg, 0.0 msec/call avg
```

### 测试2
```bash
/usr/local/coreseek/bin/indexer -c etc/csft.conf --all
```
正确的输出：
```bash
Coreseek Fulltext 3.2 [ Sphinx 0.9.9-release (r2117)]
Copyright (c) 2007-2011,
Beijing Choice Software Technologies Inc (http://www.coreseek.com)

 using config file 'etc/csft.conf'...
indexing index 'xml'...
collected 3 docs, 0.0 MB
sorted 0.0 Mhits, 100.0% done
total 3 docs, 7585 bytes
total 0.006 sec, 1165488 bytes/sec, 460.97 docs/sec
total 2 reads, 0.000 sec, 4.2 kb/call avg, 0.0 msec/call avg
total 7 writes, 0.000 sec, 3.1 kb/call avg, 0.0 msec/call avg
```

### 测试3
```bash
/usr/local/coreseek/bin/indexer -c etc/csft.conf xml
```
正确的输出：
```bash
Coreseek Fulltext 3.2 [ Sphinx 0.9.9-release (r2117)]
Copyright (c) 2007-2011,
Beijing Choice Software Technologies Inc (http://www.coreseek.com)

 using config file 'etc/csft.conf'...
indexing index 'xml'...
collected 3 docs, 0.0 MB
sorted 0.0 Mhits, 100.0% done
total 3 docs, 7585 bytes
total 0.010 sec, 721007 bytes/sec, 285.17 docs/sec
total 2 reads, 0.000 sec, 4.2 kb/call avg, 0.0 msec/call avg
total 7 writes, 0.000 sec, 3.1 kb/call avg, 0.0 msec/call avg
```

### 测试4
```bash
/usr/local/coreseek/bin/search -c etc/csft.conf
```
正确的输出：
```bash
Coreseek Fulltext 3.2 [ Sphinx 0.9.9-release (r2117)]
Copyright (c) 2007-2011,
Beijing Choice Software Technologies Inc (http://www.coreseek.com)

 using config file 'etc/csft.conf'...
index 'xml': query '': returned 3 matches of 3 total in 0.001 sec

displaying matches:
1. document=1, weight=1, published=Thu Apr  1 22:20:07 2010, author_id=1
2. document=2, weight=1, published=Thu Apr  1 23:25:48 2010, author_id=1
3. document=3, weight=1, published=Thu Apr  1 12:01:00 2010, author_id=2

words:
```

### 测试5
```bash
/usr/local/coreseek/bin/search -c etc/csft.conf -a Twittter和Opera都提供了搜索服务
```
正确的输出：
```bash
Coreseek Fulltext 3.2 [ Sphinx 0.9.9-release (r2117)]
Copyright (c) 2007-2011,
Beijing Choice Software Technologies Inc (http://www.coreseek.com)

 using config file 'etc/csft.conf'...
index 'xml': query 'Twittter和Opera都提供了搜索服务 ': returned 3 matches of 3 total in 0.004 sec

displaying matches:
1. document=3, weight=24, published=Thu Apr  1 12:01:00 2010, author_id=2
2. document=1, weight=4, published=Thu Apr  1 22:20:07 2010, author_id=1
3. document=2, weight=3, published=Thu Apr  1 23:25:48 2010, author_id=1

words:
1. 'twittter': 1 documents, 3 hits
2. '和': 3 documents, 15 hits
3. 'opera': 1 documents, 25 hits
4. '都': 2 documents, 4 hits
5. '提供': 0 documents, 0 hits
6. '了': 3 documents, 18 hits
7. '搜索': 2 documents, 5 hits
8. '服务': 1 documents, 1 hits
```
以上测试如果输出都正确，表示coreseek安装成功。

## 启动coreseek搜索引擎
```bash
/usr/local/coreseek/bin/searchd -c etc/csft.conf
```
## 停止搜索引擎
```bash
/usr/local/coreseek/bin/searchd -c etc/csft.conf --stop
```

/etc/csft.conf只是sphinx全文检索配置的一个模板，实际应该根据产品需要自己编写配置文件。

至此，coreseek就已经安装好了。下一步是要编译它相关的so文件，提供给php用，让php能够利用api来使用全文搜索引擎提供的服务。


