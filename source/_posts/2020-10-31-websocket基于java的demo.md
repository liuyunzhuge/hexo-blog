---
title: websocket基于java的demo
tags:
  - websocket
categories:
  - java
date: 2020-10-31 16:51:05
---


用java做后端开发的一个websocket小demo。

<!-- more -->

## 效果
<img src="{% asset_path "01.png" %}" width="900">

## 后端部分
提供给前端的连接类：
```java MessageConnector.java
package message;

import com.google.gson.Gson;
import message.bean.TextMessage;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@ServerEndpoint("/message/{clientId}")
public class MessageConnector {

    private static MessageConversation conversation = new MessageConversation();
    private String clientId;

    @OnOpen
    public void onOpen(@PathParam("clientId") String clientId, Session session) throws IOException {
        this.clientId = clientId;
        MessageClient existsClient = conversation.findClient(clientId);
        if (existsClient != null) {
            conversation.unregisterClient(existsClient);
        }
        conversation.registerClient(new MessageClient(clientId, session));
        System.out.println("新的客户端已登入：" + clientId);
    }

    @OnClose
    public void onClose() throws IOException {
        conversation.unregisterClient(conversation.findClient(clientId));
        System.out.println("客户端已退出：" + clientId);
    }

    @OnMessage
    public void onMessage(String message) throws IOException {
        System.out.println("收到消息：" + message);
        TextMessage textMessage = new Gson().fromJson(message, TextMessage.class);
        textMessage.time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        conversation.dispatchMessage(textMessage);
    }

    @OnError
    public void onError(Session session, Throwable error) {
        conversation.unregisterClient(conversation.findClient(clientId));
        System.out.println("客户端意外退出：" + clientId);
        error.printStackTrace();
    }
}
```

会话类：
```java MessageConversation.java
package message;

import com.google.gson.Gson;
import message.bean.TextMessage;

import java.util.HashSet;
import java.util.Set;

public class MessageConversation {
    private Set<MessageClient> clients = new HashSet<>();

    public MessageConversation() {
    }

    public void registerClient(MessageClient client) {
        clients.add(client);
    }

    public void unregisterClient(MessageClient client) {
        clients.remove(client);
    }

    public MessageClient findClient(String clientId) {
        return clients.stream().filter(client -> client.id.equals(clientId)).findFirst().orElse(null);
    }

    public void dispatchMessage(TextMessage textMessage) {
        clients.forEach(client -> {
            if (!textMessage.from.clientId.equals(client.id)) {
                client.session.getAsyncRemote().sendText(new Gson().toJson(textMessage));
            }
        });
    }
}
```

客户端类:
```java MessageClient.java
package message;

import javax.websocket.Session;
import java.util.Objects;

public class MessageClient {
    public String id;
    public Session session;
    public String name;

    public MessageClient(String id, Session session) {
        this.id = id;
        this.session = session;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MessageClient that = (MessageClient) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
```

简单的消息类：
```java TextMessage.java
package message.bean;

public class TextMessage {

    public String text;
    public From from;
    public String time;
    public static class From {
        public String clientId;
        public String name;
    }
}
```

**注意事项**
依赖了：websocket标准和gson; websocket的jar包在tomcat的lib文件夹下有，gson的jar包需要到maven仓库中下载。

## 前端部分：
```html index.html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
        body, html {
            height: 100%;
            width: 100%;
            margin: 0;
        }

        .input_area {
            height: 80px;
            width: 100%;
            display: flex;
            position: fixed;
            bottom: 0;
            border-top: 1px solid #f2f2f2;
        }

        .input_area > div:first-child {
            flex: 1;
        }

        .input_area > div:last-child {
            width: 100px;
        }

        .input_area textarea, .input_area button {
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
        }

        .input_area textarea {
            padding: 12px;
            line-height: 1.6;
            letter-spacing: .3px;
        }

        .input_area button {
            background-color: #f9f9f9;
        }

        .input_area button:active {
            background-color: #eee;
        }

        .message_item {
            padding: 0 15px;
            margin: 12px 0;
        }

        .message_item .hd {
            font-size: 12px;
        }

        .message_item .hd .name {
            color: #555;
        }

        .message_item .hd .time {
            color: #666;
            padding-left: 15px;
        }

        .message_item .bd {
            line-height: 1.6;
            letter-spacing: .3px;
            font-size: 12px;
            padding: 8px 10px;
            margin-top: 8px;
            display: inline-block;
            border-radius: 4px;
            background-color: #fafafa;
        }

        .message_item.self {
            text-align: right;
        }

        .message_item.self .bd {
            color: #fff;
            background-color: #07c160;
        }

        .message_item.self .hd .name {
            color: #07c160;
        }

        .message_item.self .hd .time {
            display: none;
        }
    </style>
</head>
<body>
<div class="message_area" id="message_area"></div>
<div class="input_area">
    <div>
        <textarea id="messageInput" placeholder="输入要发送的消息"></textarea>
    </div>
    <div>
        <button id="btnSend" type="button" class="btn" onclick="send()">发送</button>
    </div>
</div>
<script>
    const messageInput = document.querySelector('#messageInput'),
        message_area = document.querySelector('#message_area'),
        clientId = localStorage.clientId || (Date.now() + Math.random() * 1000000 ^ 0),
        name = localStorage.name || prompt('请输入一个昵称'),
        server = `ws://localhost:8080${location.pathname}message/${clientId}`

    let socket = null;

    localStorage.setItem('clientId', clientId);
    localStorage.setItem('name', name);
    document.title = name;

    let shifted = false;
    document.addEventListener('keydown', e => {
        if (e.key === 'Shift') {
            shifted = true;
        }
    });
    document.addEventListener('keyup', e => {
        if (e.key === 'Shift') {
            shifted = true;
        }
    });
    document.addEventListener('keyup', e => {
        shifted = false;
    });
    messageInput.addEventListener('keypress', e => {
        if (!shifted && e.key === 'Enter') return requestAnimationFrame(send);
    })

    function createSocket() {
        socket = new WebSocket(server);
        socket.onclose = socket.onerror = e => {
            socket = null;
        };
        socket.onmessage = e => {
            const data = JSON.parse(e.data);
            appendMessage(data);
        };
    }

    createSocket();

    function send() {
        if (!socket) {
            createSocket();
        }

        const value = messageInput.value;
        messageInput.value = '';
        const data = {
            text: value,
            from: {
                clientId: clientId,
                name: name
            },
            time: ''
        };
        socket.send(JSON.stringify(data));
        appendMessage(data, true);
    }

    function appendMessage(data, isSelf) {
        const elem = document.createElement('div');
        elem.innerHTML = `
            <div class="hd"><span class="name">${data.from.name}</span><span class="time">${data.time}</span></div>
            <div class="bd">${data.text.replace(/\n/g, '<br>')}</div>
        `;
        elem.classList.add('message_item');
        if (isSelf) {
            elem.classList.add('self');
        }
        message_area.appendChild(elem)
    }
</script>
</body>
</html>
```

要点：
* 支持按住shift + enter键换行
* 支持按enter快速发送消息
* 客户端标识和昵称都存在了localStorage里面