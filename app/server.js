const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";
const dotenv = require("dotenv").config();
const cors = require("cors");
const { Pool } = require("pg");

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
/* YOUR CODE HERE */

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

// const pool = new Pool({
//   host: PGHOST,
//   database: PGDATABASE,
//   username: PGUSER,
//   password: PGPASSWORD,
//   port: 5432,
//   ssl: {
//     require: true,
//   },
// });

app.get("/database", async (req, res) => {
    console.log("connected");
    const client = await pool.connect();

    try {
        const result = await pool.query("SELECT * FROM users");

        console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
    } finally {
        client.release();
    }

    res.status(404);
});

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});
