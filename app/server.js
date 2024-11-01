const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

app.use(express.static("public"));
app.use(express.json());
/* YOUR CODE HERE */

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});
