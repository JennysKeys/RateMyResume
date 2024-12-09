const WebSocket = require("ws");
const http = require("http");
const url = require("url");

const port = 8080; // Use port 8080 for local development

const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
    console.log("Client connected");
    let queryParams = url.parse(req.url, true).query;
    let userID = queryParams.userID;
    ws.userID = userID;

    ws.on("message", function incoming(message) {
        let parsedMessage = JSON.parse(message);
        wss.clients.forEach((client) => {
            if (
                client.readyState === WebSocket.OPEN &&
                client.userID === parsedMessage.receiverID
            ) {
                client.send(parsedMessage);
            }
        });
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

server.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
});

function startWebSocketServer() {
    console.log("WebSocket Server started");
}

function broadcastMessage(message) {
    console.log(message);
    console.log("hello");

    wss.clients.forEach((client) => {
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
