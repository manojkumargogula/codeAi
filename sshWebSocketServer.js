// sshWebSocketServer.js
const { Client } = require('ssh2');
const WebSocketServer = require('ws').Server;
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  ws.on('message', (message) => {
    const { host, username, password, command } = JSON.parse(message);

    const ssh = new Client();
    ssh.on('ready', () => {
      console.log('SSH Client Ready');
      ssh.exec(command, (err, stream) => {
        if (err) {
          console.error('SSH Command Error:', err);
          ws.send(JSON.stringify({ error: err.message }));
          return;
        }

        stream.on('close', () => {
          console.log('SSH Stream Closed');
          ssh.end();
        }).on('data', (data) => {
          ws.send(JSON.stringify({ output: data.toString() }));
        }).stderr.on('data', (data) => {
          ws.send(JSON.stringify({ error: data.toString() }));
        });
      });
    }).connect({
      host,
      username,
      password // Consider using key-based authentication in production
    });
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
