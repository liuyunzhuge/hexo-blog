---
title: mac下前端及php开发环境要点记录
tags:
- mac开发环境
categories:
- 开发环境
---

这是一篇个人笔记。主要记录自己工作和学习过程中一些开发环境配置要点，以后再更换电脑时可参考。
<!-- more -->

## 虚拟机及主机基本配置
1. 虚拟机联网
2. 主机与虚拟机ssh互通
3. 主机与虚拟机文件夹共享

这个部分内容的笔记全都详细地记录在：{% post_link "mac-os通过virtual-box安装centos系统" "mac os下centos虚拟机的安装、网络及文件共享配置" %}。

## centos下的软件配置
### wget
这个基本的工具，centos没有自带。

### node
到node官网找到linux x64二进制包的下载链接：
{% asset_img 02.png [title] %}

进入虚拟机，运行：
```bash
mkdir -p /home/downloads
```
作为以后系统下载新包时的文件夹。

然后通过wget下载node的二进制包：
```bash
wget https://nodejs.org/dist/v10.16.0/node-v10.16.0-linux-x64.tar.xz
```
```bash
[root@localhost downloads]# ls
lnmp1.6  lnmp1.6.tar.gz  node-v10.16.0-linux-x64.tar.xz
```

然后运行一下：
```bash
xz -d node-v10.16.0-linux-x64.tar.xz
tar -xvf node-v10.16.0-linux-x64.tar
```
这样node的二进制文件夹就解压出来了：
```bash
[root@localhost downloads]# cd node-v10.16.0-linux-x64
[root@localhost node-v10.16.0-linux-x64]# ls
bin  CHANGELOG.md  include  lib  LICENSE  README.md  share
```
node已经可以在/home/downloads/node-v10.16.0-linux-x64/bin下面可以直接拿来用了，但是这样肯定用起来不方便。
第一步先把node-v10.16.0-linux-x64这个文件夹移动到/usr/local目录，/usr/local目录是centos大部分软件的安装目录，所以放到那里比较合适：
```bash
mv  node-v10.16.0-linux-x64 /usr/local/node
```
然后运行下面的命令，把/usr/local/node/bin下的可执行文件部署到PATH路径：
```bash
ln -s /usr/local/node/bin/node /usr/local/bin/node 
ln -s /usr/local/node/bin/npm /usr/local/bin/npm 
```
最后通过下面的命令来检查node跟npm是否全局可用：
```bash
[root@localhost node]# node -v
v10.16.0
[root@localhost node]# npm -v
6.9.0
```

### cnpm
安装方式：https://npm.taobao.org/

装好以后，运行下面的命令让cnpm全局可用：
```bash
ln -s /usr/local/node/bin/cnpm /usr/local/bin/cnpm 
```

## mac下的软件配置
### sublime text
安装方式：参考网上资料。

### node
直接到官网下载mac的安装包即可安装。

### git
直接到官网下载git的安装包即可安装。
遇到的问题：
打不开“git-2.21.0-intel-universal-mavericks.pkg”，因为它来自身份不明的开发者。
解决方式：
通过spotlight搜索安全性与隐私，允许git的安装：
{% asset_img 01.png [title] %}

### cnpm
安装方式：https://npm.taobao.org/
遇到的问题：
npm WARN checkPermissions Missing write access to /usr/local/lib/node_modules
解决方式：
运行:
```bash
sudo su
```
切换到root用户后，再来执行cnpm的安装命令。

npm或cnpm以后安装东西都有可能遇到权限问题，都可以通过切换到root用户来解决。

### hexo
这次是把hexo从win10那边同步到mac来。所以跟hexo官网方式不太一样。把blog从github克隆mac以后。先运行：
```bash
cnpm install -g hexo-cli
```
之后cd到blog目录，然后运行
```bash
cnpm install
```
把hexo依赖的库都装好就能跑起来了。
由于今后可能会用到2台电脑写博客，以后新建文章时，资源文件夹即使暂时不放东西，最好也是往里面放一个空的.gitkeep文件，以便能把这个目录提交到git，另外一台电脑就能拉取下来了。




