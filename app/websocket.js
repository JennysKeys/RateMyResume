const WebSocket = require("ws");
const url = require("url");
const port = 3001;

let server;

function startWebSocketServer() {
    server = new WebSocket.Server({ port: port });
    server.on("connection", (ws, req) => {
        console.log("Client connected");
        let queryParams = url.parse(req.url, true).query;
        let userID = queryParams.userID;
        ws.userID = userID;

        ws.on("message", function incoming(message) {
            let parsedMessage = JSON.parse(message);
            server.clients.forEach((client) => {
                if (
                    client.readyState === WebSocket.OPEN &&
                    client.userID === parsedMessage.receiverID
                ) {
                    client.send(parsedMessage);
                }
            });
        });
        ws.on("close", function () {
            console.log("Client disconnected");
        });
    });
    console.log(`WebSocket server running on port ${port}`);
}

function broadcastMessage(message) {
    console.log(message);
    console.log("hello");

    if (!server) {
        startWebSocketServer();
    }

    server.clients.forEach((client) => {
        console.log(client.userID);
        if (
            client.readyState === WebSocket.OPEN &&
            client.userID === message.receiver_id
        ) {
            console.log(client.userID);
            console.log("sending msg");
            client.send(JSON.stringify(message));
        }
    });
}

module.exports = { startWebSocketServer, broadcastMessage };
