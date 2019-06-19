---
title: 编译coreseek的php扩展sphinx.so文件
tags:
  - 运维知识
categories:
  - 运维管理
---

本篇在{% post_link "centos安装coreseek作为全文搜索引擎" "centos安装coreseek作为全文搜索引擎" %}的基础上，编译coreseek的php库文件sphinx.so，以便php应用能够sphinx的api调用搜索引擎服务。

<!-- more -->

因为我虚拟机内安装的是php7.0，而sphinx并没有正式推出php7.0的扩展，所以官方下载里面，下载不到编译所需要的源文件。php7.0需要的文件可以通过这个链接下载：
http://git.php.net/?p=pecl/search_engine/sphinx.git;a=snapshot;h=339e123acb0ce7beb2d9d4f9094d6f8bcf15fb54;sf=tgz
如果不是php7.0，则可以通过这个链接下载：http://pecl.php.net/get/sphinx-1.2.0.tgz

开始编译。

## 安装libsphinxclient
进入coreseek的解压目录，执行：
```bash
cd /home/downloads/coreseek-3.2.14
cd csft-3.2.14/api/libsphinxclient
./configure --prefix=/usr/local/sphinxclient
make && make install
```

## 安装sphinx.so
回到/home/downloads目录，执行：
```bash
cd /home/downloads
wget -c "http://git.php.net/?p=pecl/search_engine/sphinx.git;a=snapshot;h=339e123acb0ce7beb2d9d4f9094d6f8bcf15fb54;sf=tgz"
```
上面的命令会把wget后面的文件下载下来，但是下载下来的并不是一个.tar.gz格式的文件，所以需要做下重命名：
```bash
mv index.html\?p\=pecl%2Fsearch_engine%2Fsphinx.git\;a\=snapshot\;h\=339e123acb0ce7beb2d9d4f9094d6f8bcf15fb54\;sf\=tgz sphinx.tar.gz
```

接下来继续：
```bash
tar zxf sphinx.tar.gz
#上面解压后的文件夹是sphinx-339e123
cd sphinx-339e123
/usr/local/php/bin/phpize
make && make install
```

安装成功后会显示：
```bash
Build complete.
Don't forget to run 'make test'.

Installing shared extensions:     /usr/local/php/lib/php/extensions/no-debug-non-zts-20151012/
```

接下来把/usr/local/php/lib/php/extensions/no-debug-non-zts-20151012/sphin.so放到php的安装目录去:
```bash
mkdir -p /usr/local/php/extensions
mv /usr/local/php/lib/php/extensions/no-debug-non-zts-20151012/sphinx.so /usr/local/php/extensions
```

然后修改php.ini：
```bash
vim /usr/local/php/etc/php.ini
```
找到extension_dir的配置，取消注释，改为：
```bash
extension_dir = "/usr/local/php/extensions"
```
并在php.ini最后加入:
```bash
extension = sphinx.so
```
最后重启php:
```bash
/etc/init.d/php-fpm restart
```
最后运行:
```bash
php -m
```
检查是否有sphinx。 有就是安装好了。

