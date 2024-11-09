require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const LocalStrategy = require("passport-local").Strategy;

const app = express();

const port = 3000;
const jwtSecret = process.env.JWT_SECRET;
const hostname = "localhost";
const dotenv = require("dotenv").config();
const cors = require("cors");
const { Pool } = require("pg");

const path = require("path");
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(passport.initialize());

/* YOUR CODE HERE */

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: {
    require: true,
  },
});

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

app.get("/posts", async (req, res) => {
  const limit = parseInt(req.query.limit) || 2; //Number of posts to load per batch
  const offset = parseInt(req.query.offset) || 0; //Offset to start fetching posts from

  try {
    const result = await pool.query(
      `
      SELECT Users.username, Posts.title, Posts.created_at
      FROM Posts
      JOIN Users ON Posts.userID = Users.userID
      ORDER BY Posts.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "An error occurred while fetching posts" });
  }
});

const users = [
  {
    username: "testuser",
    password: "$2a$10$1C0PmG9y2rh9Y1uA2/O69uRhbA8e1zpxrqXXyExIQoZdv5t31/rUW", // bcrypt hashed password for 'testpassword'
  },
];

passport.use(
  new LocalStrategy((username, password, done) => {
    const user = users.find((u) => u.username === username);
    if (!user) return done(null, false, { message: "Invalid credentials" });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return done(err);
      if (!isMatch)
        return done(null, false, { message: "Invalid credentials" });
      return done(null, user);
    });
  })
);
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });
    if (!user)
      return res.status(401).json({ success: false, message: info.message });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
    });
  })(req, res, next);
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
