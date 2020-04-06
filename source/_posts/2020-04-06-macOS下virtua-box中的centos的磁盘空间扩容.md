---
title: macOS下virtua box中的centos的磁盘空间扩容
tags:
  - 运维知识
categories:
  - 运维管理
date: 2020-04-06 15:05:15
---


这是一篇笔记，记录macOS下virtua box中的centos的磁盘空间扩容的要点。
<!-- more -->

环境：
* macOS
* virtual box
* centos7

问题：磁盘空间不够，1个3GB的数据库文件无法恢复：
<img src="{% asset_path "01.jpg" %}" width="800">
如果所示，`/`目录挂载的是`/dev/mapper/centos-root`这个磁盘设备，该目录是整个虚拟机最大的一个存储区，当时分区只做了这一个。
如何对它进行扩容？

## 第一步，给虚拟机分配更多的空间
关闭虚拟机，然后进入macOS的应用程序，找到virtual box，然后右键选择显示包内容，
<img src="{% asset_path "02.png" %}" width="600">
<img src="{% asset_path "03.png" %}" width="300">
<img src="{% asset_path "04.png" %}" width="500">
在命令行中打开`macOS`这个目录，就可以运行`vboxmanage`这个命令，然后运行：
```
vboxmanage list hdds
```
找到虚拟机的UUID，接下来给虚拟机增加存储空间时会用到。
```
UUID:           c8055692-a2d2-4a22-a97b-db3fe8bb9f36
Parent UUID:    base
State:          created
Type:           normal (base)
Location:       /Users/wangdanlu/zengxf/virtual_machine/centos/centos.vdi
Storage format: VDI
Capacity:       40960 MBytes
Encryption:     disabled
```
我得到的是`c8055692-a2d2-4a22-a97b-db3fe8bb9f36`

接下来通过`VBoxManage modifyhd <uuid> –-resize 40960`来调整存储空间大小。 40960就是40GB，uuid就是上一步查询出来的：
```
VBoxManage modifyhd c8055692-a2d2-4a22-a97b-db3fe8bb9f36 –-resize 40960
```

接着打开virtual box，注意不是启动虚拟机，然后查看虚拟机系统的存储空间状态：
<img src="{% asset_path "05.png" %}" width="800">
从这里看到虚拟机的存储空间已经增加了，但是这个时候加进去的空间并没有生效，还需要继续处理。

## 第二步，通过gparted工具，来给已经存在磁盘分区扩容
第一步新加进去的磁盘空间，输入未分配的空间，如果要使用，需要把这些空间，变为磁盘分区的一部分，这里会借助到一个磁盘分区工具：[gparted](https://gparted.org/download.php)，点击该链接可前往下载，得到的是一个iso文件。因为虚拟机安装的是一个纯命令行的系统，磁盘分区使用不方便，gparted是一个可视化的软件，可以来管理磁盘分区。

下载后以后，将gparted载入到虚拟机的光驱：

<img src="{% asset_path "06.png" %}" width="800">

接下来启动虚拟机，按照下面的步骤依次完成分区的空间扩容：
<img src="{% asset_path "07.jpg" %}" width="800">
<img src="{% asset_path "08.jpg" %}" width="800">
<img src="{% asset_path "09.jpg" %}" width="800">
<img src="{% asset_path "10.jpg" %}" width="800">
<img src="{% asset_path "18.png" %}" width="800">
<img src="{% asset_path "11.png" %}" width="800">
<img src="{% asset_path "12.png" %}" width="800">
<img src="{% asset_path "13.png" %}" width="800">
<img src="{% asset_path "14.png" %}" width="800">
<img src="{% asset_path "15.png" %}" width="800">
<img src="{% asset_path "16.png" %}" width="800">
<img src="{% asset_path "17.png" %}" width="800">

## 第三步、进入虚拟机对逻辑卷进行扩容
前2步做完，部分场景可能就成功了，但是我的虚拟机分区，采用的是LVM的方式，支持动态扩容，所以前2步做完，进入系统发现`/dev/mapper/centos-root`还是没有增加空间，通过查阅资料发现，还需要进行逻辑卷的扩容。
<img src="{% asset_path "19.png" %}" width="800">

什么是LVM？[这里有答案](https://www.cnblogs.com/moox/p/11163229.html)

运行:
```
lvs
```
得到当前的逻辑卷的`vg名称`和`lv名称`:
<img src="{% asset_path "20.png" %}" width="800">
如图所示，与14GB存储空间对应的逻辑卷的名称是`root`，它的`vg`名称为`centos`。所以这个逻辑卷的设备名就是:`/dev/centos/root`。

运行:
```
vgs
```
查看`centos`这个vg现在的空间情况，可以看到它还有24GB空间多余，正好是一开始做虚拟机存储扩容的那个空间，也是第二步做磁盘分区扩容的那个空间：

<img src="{% asset_path "22.png" %}" width="800">

接下来运行：
```
lvextend -L +24GB -n /dev/centos/root
```
<img src="{% asset_path "21.png" %}" width="800">
这个命令对`/dev/centos/root`这个逻辑卷，进行了扩容，增加了24GB。

通过lvs可以看到逻辑卷已经被成功扩容：
<img src="{% asset_path "23.png" %}" width="800">

此时尽管lv已经被扩容，但是文件系统还没有变化，通过`df`查看文件系统，会看到空间还是之前的14G，没有增加，所以还需要对文件系统进行更新：
<img src="{% asset_path "24.png" %}" width="800">
我在电脑上运行的是：
```
xfs_growfs /dev/centos/root
```
一开始运行的是`resize2fs /dev/centos/root`，但是报错了，上图中有演示。

最后查了跟文件系统有关，我虚拟机中`/dev/centos/root`的文件系统是`xfs`，所以需要用`xfs_growfs`命令，而不是`resize2fs`。

