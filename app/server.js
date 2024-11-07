const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";
const dotenv = require("dotenv").config();

app.use(express.static("public"));
app.use(express.json());
/* YOUR CODE HERE */

const {PGHOST, PGDATABASE, PGUSER, PGPASSWORD} = process.env;

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE, 
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        require: true,
    }
})

app.get("/", async() => {

})

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});
