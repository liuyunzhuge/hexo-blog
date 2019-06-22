---
title: centos配置开机启动的任务
tags:
  - 运维知识
categories:
  - 运维管理
---


之前把服务器开机启动的任务放到/etc/rc.local里面，总是不生效，后来在安装redis的时候，发现它redis_init_script的使用方式，能够将redis通过service来管理，同时还能做到开机自动调用redis service的start逻辑，所以如果要自定义一些开机启动的任务，也可以用这个方式来做。
<!-- more -->

第一步，在/etc/init.d文件夹下创建一个用于充当service的文件，如startd，并给它添加可执行的权限：
```bash
cd /etc/init.d/
touch startd
chmod +x startd
```

第二步，按照下面的文件模板，编写startd内的shell程序：
```bash
#!/bin/sh
# chkconfig: 2345 90 10

CORESEEK_PIDFILE=/usr/local/coreseek/var/log/searchd_mysql.pid
SUPERVISOR_PIDFILE=/tmp/supervisord.pid

CORESEEK_EXEC=/usr/local/coreseek/bin/searchd
CORESEEK_CONF=/usr/local/coreseek/etc/yourcontent.conf

SUPERVISOR_EXEC=supervisord
SUPERVISOR_CTL_EXEC=supervisorctl
SUPERVISOR_CONF=/etc/supervisord.conf

case "$1" in
    start)
        #starting coreseek
        if [ -f $CORESEEK_PIDFILE ]
        then
                echo "$CORESEEK_PIDFILE exists, coreseek is already running or crashed"
        else
                echo "Starting coreseek ...==========================================>"
                $CORESEEK_EXEC -c $CORESEEK_CONF
        fi

        #starting supervisor
        if [ -f $SUPERVISOR_PIDFILE ]
        then
                echo "$SUPERVISOR_PIDFILE exists, supervisor is already running or crashed"
        else
                echo "Starting supervisor ...========================================>"
                $SUPERVISOR_EXEC -c $SUPERVISOR_CONF
        fi
        ;;
    stop)
        #stop coreseek
        if [ ! -f $CORESEEK_PIDFILE ]
        then
                echo "$CORESEEK_PIDFILE does not exist, coreseek is not running"
        else
                PID=$(cat $CORESEEK_PIDFILE)
                echo "Stopping coreseek ..."
                $CORESEEK_EXEC -c $CORESEEK_CONF --stop
                while [ -x /proc/${PID} ]
                do
                    echo "Waiting for coreseek to shutdown ..."
                    sleep 1
                done
                echo "coreseek stopped==============================================>"
        fi
        #stop supervisor
        if [ ! -f $SUPERVISOR_PIDFILE ]
        then
                echo "$SUPERVISOR_PIDFILE does not exist, supervisor is not running"
        else
                PID=$(cat $SUPERVISOR_PIDFILE)
                echo "Stopping supervisor ..."
                $SUPERVISOR_CTL_EXEC shutdown
                while [ -x /proc/${PID} ]
                do
                    echo "Waiting for supervisor to shutdown ..."
                    sleep 1
                done
                echo "supervisor stopped============================================>"
        fi
        ;;
    *)
        echo "Please use start or stop as first argument"
        ;;
esac
```
上面这个模板文件有2个要点：
1. 前2行必不可少
2. case结构内的start和stop分支也必须固定，因为当把startd当service调用的时候，调用的就是这个文件里面start和stop的逻辑

上面startd里面的文件内容，在start的时候通过判断pid文件是否存在，不存在才会执行命令；在stop的时候，也做了pid文件判断，而且还会等待进程完全销毁之后才退出。

第三步，将服务设置为开机启动
```bash
chkconfig startd on
```

这样startd内的任务开机就会启动起来了。

其它：
* 手动停止startd的启动过的任务
```bash
service startd stop
```

* 手动启动startd的任务
```bash
service stard start
```






