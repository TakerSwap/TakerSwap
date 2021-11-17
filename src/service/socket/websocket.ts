interface Params {
  url: string;
  channel: string;
  params: any;
  success: (data: any) => void;
  error?: () => void;
}

interface Socket {
  [key: string]: WebSocketBuilder;
}

interface UpdateHandle {
  [key: string]: Callback[];
}

type Callback = (data: any) => void;

class WebSocketBuilder {
  static sockets: Socket = {};

  timeout: number;
  timer1: any;
  timer2: any;
  lockReconnect: boolean;
  url: string;
  updateHandle: UpdateHandle;
  ws: WebSocket | null;
  status: string;
  // onOpen: () => void
  onOpen = () => {};
  constructor(url: string) {
    this.timeout = 20000;
    this.timer1 = null;
    this.timer2 = null;
    this.lockReconnect = false;
    this.url = url;
    this.updateHandle = {};
    this.ws = null;
    this.status = "";
    // this.connect();
    // this.initEvent();
  }

  connect(onOpen: () => void) {
    const ws = (this.ws = new WebSocket(this.url));
    this.status = "";
    // const ws = this.ws;
    // if (!ws) return;
    this.onOpen = onOpen;
    ws.onopen = () => {
      // this.status = true;
      onOpen();
      this.heartCheck();
    };
    ws.onmessage = msg => {
      // 每次接收到消息都执行一次心跳
      this.heartCheck();
      this.handleMessage(msg);
    };
    ws.onclose = data => {
      // this.status = false;
      // this.status = "close";
      this.reconnect();
      console.error("连接关闭", data);
    };
    ws.onerror = err => {
      // this.status = false;
      this.reconnect();
      console.error("连接发生异常, 即将重新连接:", err);
    };
  }

  listen(channel: string, params: any, handle: Callback) {
    if (this.ws?.readyState === 0) {
      setTimeout(() => {
        this.listen(channel, params, handle);
      }, 200);
    } else {
      const existHandle = this.updateHandle[channel];
      if (existHandle && existHandle.length) {
        this.updateHandle[channel].push(handle);
      } else {
        this.updateHandle[channel] = [handle];
      }
      const msg = JSON.stringify({
        action: "Subscribe",
        ...params
      });
      this.send(msg);
    }
  }

  send(msg: string) {
    this.ws?.send(msg);
  }

  unListen(channel: string) {
    if (this.ws?.readyState === 0) {
      setTimeout(() => {
        this.unListen(channel);
      }, 200);
    } else {
      delete this.updateHandle[channel];
      this.send(JSON.stringify({ action: "Unsubscribe", channel }));
    }
  }

  handleMessage(msg: any) {
    const res = JSON.parse(msg.data);
    if (!res.data || !res.action) return;
    switch (res.action) {
      case "Subscribe":
      case "Unsubscribe":
        break;
      case "Data":
        const data = JSON.parse(res.data);
        // console.log("method: "+ data.method, data)
        const handles = this.updateHandle[data.method];
        console.log("----method----", data.method);
        console.log("----" + data.method + "-res----", JSON.parse(data.data));
        if (handles && handles.length) {
          handles.forEach(handle => handle(JSON.parse(data.data)));
        }
        break;
      case "Error":
      // this.onError && this.onError(data);
    }
  }

  close() {
    this.ws?.close();
  }

  // 心跳检测
  heartCheck() {
    clearTimeout(this.timer1);
    clearTimeout(this.timer2);
    this.timer1 = setTimeout(() => {
      this.ws?.send(JSON.stringify({ ping: new Date().getTime() }));
      this.timer2 = setTimeout(() => {
        this.ws?.close();
      }, this.timeout);
    }, this.timeout);
  }

  reconnect() {
    if (this.lockReconnect || this.status === "close") return;
    this.lockReconnect = true;
    setTimeout(() => {
      //没连接上会一直重连，设置延迟避免请求过多
      this.connect(this.onOpen);
      this.lockReconnect = false;
    }, 2000);
  }
}

export function listen(data: Params) {
  const { url, channel, params, success } = data;
  const socket = WebSocketBuilder.sockets[url];
  if (!socket) {
    const newSocket = new WebSocketBuilder(url);
    WebSocketBuilder.sockets[url] = newSocket;
    newSocket.connect(() => {
      newSocket.listen(channel, params, success);
    });
  } else {
    if (socket.updateHandle[channel]) {
      socket.unListen(channel); // 先取消之前的
    }
    socket.listen(channel, params, success);
  }
}

export function unListen(url: string, channel: string) {
  const socket = WebSocketBuilder.sockets[url];
  if (!socket) {
    console.log("没有websocket任务，不需要关闭");
  } else {
    socket.unListen(channel);
  }
}
