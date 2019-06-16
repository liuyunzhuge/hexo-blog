---
title: mac os下centos虚拟机的安装、网络及文件共享配置
tags:
  - mac开发环境
categories:
  - 开发环境
date: 2019-06-16 11:33:34
---


准备用mac pro作为开发机。之前在win10下，一直都是通过虚拟机来作为主要开发环境，这次用mac也想这么干。最重要的3个实现目标是：
1. 虚拟机能访问互联网；
2. 虚拟机与主机可以互通；
3. 虚拟机与主机有文件共享。

本篇把重要的一些笔记记录下来，方便日后参考。

<!-- more -->

## 安装virtual box虚拟机
这次选用的是virtual box虚拟机来安装，没别的原因，只为它是免费的，可以下载最新版。下载及安装过程本篇不记录。


## 安装centos系统
首先要下载一个centos的镜像文件，我从官方下载到的是CentOS-7-x86_64-Minimal-1810。virtual box安装centos的过程，本篇不记录。

只要mac是联网的，安装centos的时候，就可以设置网络，这样系统装好以后，centos就可以访问互联网了。记得使用ping命令测试一下。
```bash
[root@localhost ~]# ping www.baidu.com
PING www.a.shifen.com (61.135.169.121) 56(84) bytes of data.
^C64 bytes from 61.135.169.121: icmp_seq=1 ttl=63 time=4.46 ms

--- www.a.shifen.com ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 4.465/4.465/4.465/0.000 ms
```

到了这里，本篇的第一个目标就完成了。虚拟机能访问互联网之后，以后前端或后端的开发环境都可以直接在虚拟机里进行联网配置了，比如node git npm composer等。

## mac与虚拟机互通
centos装好以后，虚拟机应该是可以ping通mac主机的，但是主机不一定能ping通虚拟机。

这是因为虚拟机默认情况下使用的是下面这个网卡模式：
{% asset_img 04.png [title] %}

如果想让主机也能ping通虚拟机，有2个做法：
1. 在上面这个网卡下面配置端口转发
这个方式我试了一下，第1天是好使的，第2天就不太好用了，原因未知，所以不推荐这个方式。

2. 给虚拟机再启用一个网卡，采用host-only的方式连接主机与虚拟机。

具体做法如下：（注意在第一和第二步做完之前，最好先将虚拟机关闭）
第一，添加一个host only的网络
先打开virtual box的主机网络管理器
{% asset_img 05.png [title] %}
点击创建
{% asset_img 06.png [title] %}
得到如下一个网络配置：
{% asset_img 07.png [title] %}
记住上面的ipv4地址和ipv4网络掩码，前者是这个网络的网关地址，后者是这个网络的子网掩码，后面配置静态ip的时候需要它们。然后切换到dhcp选项卡：
{% asset_img 08.png [title] %}
看到上面的最小ip地址和最大ip地址，从这个范围确定一个ip地址，比如192.168.56.103，这将作为虚拟机要配置的静态ip地址。


第二，启用虚拟机的第二个网卡
打开虚拟机的设置，注意是虚拟机自己的设置，不是virtual box的设置。
{% asset_img 09.png [title] %}
按照1、2、3、4、5的顺序操作，注意第5步界面名称那里选择的东西，就是前面通过virtual box主机网络管理器添加的网络名称。

第三，配置虚拟机的网卡文件
先启动虚拟机，然后运行命令
```bash
cd /etc/sysconfig/network-scripts
```
进入网卡配置文件的存放目录。

运行一下ip addr命令，查看当前虚拟机内的网卡：
```bash
ip addr
```
得到如下输出：
{% asset_img 10.png [title] %}
上面图中"2:"后面的enp0s3(第1个红框)，是虚拟机安装完以后，网络配置成功后，就会自动添加的一个网卡，与虚拟机设置里面的网卡1是对应的。这个enp0s3的名称，不是固定的，不同的机器安装出来的名称可能不同，得以自己的虚拟机为准。

"3:"后面的enp0s8(第1个红框)，是前面设置虚拟机的网络，启用了网卡2以后，给虚拟机增加的网卡，对应的host only模式的网络。这个名称也不是固定的，请以自己的虚拟机为准。

确定这两个名称以后，在/etc/sysconfig/network-scripts目录下运行
```bash
ls 
```
查看是否有ifcfg-enp0s3和ifcfg-enp0s8这个文件。 通常情况下，有ifcfg-enp0s3但是没有ifcfg-enp0s8。如果没有ifcfg-enp0s8，运行：
```bash
cp ifcfg-enp0s3 ifcfg-enp0s8
```
复制出一个ifcfg-enp0s8。然后用vi对ifcfg-enp0s8进行编辑：
```bash
vi ifcfg-enp0s8
```
这个文件是从ifcfg-enp0s3复制出来的，所以在增加配置前，先把enp0s3相关的东西都改掉：
```bash
TYPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
BOOTPROTO="dhcp"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="enp0s3"
UUID="3b54fc3f-36d4-4c69-8fc4-96da89b2b3fd"
DEVICE="enp0s3"
ONBOOT="yes"
```
改三个东西：NAME,UUID,DEVICE。 把NAME和DEVICE改成enp0s8。把UUID随便改一个字符，比如把第一个3改成4。改完如下：
```bash
YPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="enp0s8"
UUID="4b54fc3f-36d4-4c69-8fc4-96da89b2b3fd"
DEVICE="enp0s8"
ONBOOT="yes"
```
在改完的基础上，增加三个配置：IPADDR,GATEWAY,NETMASK，这三个分别是网卡的ip地址，网卡对应的网关地址，网卡对应的掩码。这三个东西的值，分别填入在virtual box主机网络管理器部分记录下来的值。另外由于这个网卡要配置的是静态ip地址，而不是动态ip地址，所以还得把BOOTPROTO="dhcp"这个配置，替换为BOOTPROTO="static"，我选择的是注释掉原来的dhcp，然后新增了static，最后完整的配置文件为：
```bash
TYPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
#BOOTPROTO="dhcp"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="enp0s8"
UUID="4b54fc3f-36d4-4c69-8fc4-96da89b2b3fd"
DEVICE="enp0s8"
ONBOOT="yes"
BOOTPROTO="static"
IPADDR=192.168.56.103
GATEWAY=192.168.56.1
NETMASK=255.255.255.0
```
ipaddr: 192.168.56.103，就是虚拟机绑定的固定ip地址，mac主机可通过ssh直接连接这个地址来访问虚拟机。

配置文件修改之后，退出并保存，然后运行：
```bash
service network restart
```
重启网络。然后再次运行ip addr，检查enp0s8这个网卡有没有设置为192.168.56.103这个ip地址：
{% asset_img 11.png [title] %}

回到mac主机，打开终端，运行:
```bash
ssh root@192.168.56.103
```
尝试与虚拟机进行连接。第一次连接会出现如下提示：
```bash
xxxx:~ xxxx$ ssh root@192.168.56.103
The authenticity of host '192.168.56.103 (192.168.56.103)' can't be established.
ECDSA key fingerprint is SHA256:Og1eS6sM/dUoPXnQH6TVNd4/GE7FdH7AApWtUTfm/rg.
Are you sure you want to continue connecting (yes/no)? 
```
输入yes之后，就会提示输入密码，输完密码，就能进入虚拟机了。

至此本篇的第2个目标也实现了。

## 虚拟机与主机的文件共享
为了实现这个目标，需要安装virtual box的一个工具：VBoxGuestAdditions。这个是需要单独下载的，我的virtual box版本是6.0.8，这个工具的下载链接就是:
http://download.virtualbox.org/virtualbox/6.0.8/VBoxGuestAdditions_6.0.8.iso

这个链接地址需要根据virtual box的版本号来确定。下载好以后，记下这个文件的存放位置。

在真正安装这个工具前，我们要做2个处理，防止安装失败的情况，这是我遇到的，为了减少麻烦，先把这两个做了，再安装会比较好：
第一步，先安装bzip2，运行
```bash
yum install bzip2 -y
```
VBoxGuestAdditions需要bzip2来解压，为了防止安装失败，先把bzip2装好。

第二步，更新kernel
```bash
yum update kernel -y

yum install kernel-headers kernel-devel gcc make -y
```
这是我在安装VBoxGuestAdditions时遇到的，可能跟我的centos 版本也有关系，如果你也是我这个centos版本，建议也这么做。安装好关闭虚拟机。

接下来开始安装VBoxGuestAdditions。
首先打开虚拟机设置：
{% asset_img 12.png [title] %}
按照1、2、3、4的顺序来操作。这次设置的是虚拟机的存储部分，说白了就是要把VBoxGuestAdditions_6.0.8.iso这个镜像文件，放到虚拟机的光驱里面。
第4步，会打开finder，找到前面下载VBoxGuestAdditions_6.0.8.iso文件位置，确认即可。

设置好以后，重新启动虚拟机。开始安装：
1. 挂载光驱文件
运行:
```bash
mkdir -p /media/vbox
```
创建挂载点。运行：
```bash
mount /dev/cdrom /media/vbox
```
执行挂载。切换到挂载目录
```bash
cd /media/vbox
ls
```
可以看到iso文件里面的内容。
{% asset_img 13.png [title] %}

运行：
```bash
sh ./VBoxLinuxAdditions.run
```
开始正式安装。只要没有提示报错，就表示安装成功了。

接下来准备做mac主机与虚拟机的文件共享。首先在mac主机下，创建一个文件夹，比如我设置的：
/users/xxx/xxgxf/centos_share(隐私原因，未写完整)
然后在虚拟机里创建一个文件夹：
/home/wwwroot

关闭虚拟机，打开虚拟机设置，进行共享文件夹设置：
{% asset_img 14.png [title] %}
按照数字顺序，进行设置。注意：
第4步选择前面设置的主机文件夹，第7步选择虚拟机内的文件夹；
要勾选自动挂载和固定分配；不要勾选只读分配。

然后重启虚拟机，这样主机与虚拟机就通过2个文件夹形成共享了。你可以在主机内添加个文件，然后在虚拟机里去找找看有没有。

有了共享文件夹，以后代码就在mac里面写，然后部署在虚拟机内运行。php和node都能这么搞。

## 小结
本篇记录的都是一些开发基本点，有条件的人可以这么试一试，这个开发方式比单独在windows或者mac里面搞全套，我觉得要好一些。



