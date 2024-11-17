
const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const LocalStrategy = require("passport-local").Strategy;

const multer = require("multer");

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

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const { startWebSocketServer, broadcastMessage } = require("./websocket");

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

app.get("/filter", async(req, res) => {
    let startWhere = true;
    const limit = parseInt(req.query.limit) || 2; // Number of posts to load per batch
    const offset = parseInt(req.query.offset) || 0; // Offset to start fetching posts from
    const search = req.query.search || ""; // Get the search term from query parameters
    let schoolString = req.query.schools || "";
    let schools = schoolString.split(',');
    let majorString = req.query.majors || "";
    let majors = majorString.split(",");

    console.log(schools);

    try {
        let query = `
        SELECT Posts.title, Posts.created_at, Posts.school, Posts.major, Posts.pdf
        FROM Posts
      `;

        let queryParams = [];
        let parmsCount = 1;

        if(search || schoolString || majorString) {
            query += ` WHERE`;
        }

        // If there's a search term, add a WHERE clause
        // if (search) {
        //     query += ` LOWER(Users.username) LIKE $${parmsCount}`;
        //     parmsCount++;
        //     queryParams.push(`%${search.toLowerCase()}%`);
        //     startWhere = false;
        // }

        if (schoolString) {
            let firstSchool = true
            if(!startWhere) {
                query += ' AND';
            }
            for(school of schools) {
                if(!firstSchool) {
                    query += ' OR';
                } else {
                    query += '('
                }
                query += ` LOWER(Posts.school) LIKE $${parmsCount}`;
                parmsCount++;
                queryParams.push(`%${school.toLowerCase()}%`);
                firstSchool = false;
                startWhere = false;
            }
            query += ')'
        }

        if (majorString) {
            let firstMajor = true
            if(!startWhere) {
                query += ' AND';
            }
            for(major of majors) {
                if(!firstMajor) {
                    query += ' OR';
                } else {
                    query += '('
                }
                query += ` LOWER(Posts.major) LIKE $${parmsCount}`;
                queryParams.push(`%${major.toLowerCase()}%`);
                parmsCount++;
                firstMajor = false;
                startWhere = false;
            }
            query += ')'
        }

        // Add ORDER BY, LIMIT, and OFFSET clauses
        query += `
        ORDER BY Posts.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
        queryParams.push(limit, offset);

        console.log(query);
        console.log(queryParams);
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching filtered posts:", error);
        res.status(500).json({
            error: "An error occurred while fetching filtered posts",
        });
    }
});

app.get("/get-messages", async (req, res) => {
    const { senderID, receiverID } = req.query;
    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY sent_at ASC",
            [senderID, receiverID]
        );
        console.log("Query result:", result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error("Error getting messages:", err);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release();
    }
});

app.post("/send-message", async (req, res) => {
    const { senderID, receiverID, content } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query(
            "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *",
            [senderID, receiverID, content]
        );
        let message = result.rows[0];
        broadcastMessage(message);
        res.json(message);
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release();
    }
});

app.get("/posts", async (req, res) => {
    const limit = parseInt(req.query.limit) || 2; // Number of posts to load per batch
    const offset = parseInt(req.query.offset) || 0; // Offset to start fetching posts from
    const search = req.query.search || ""; // Get the search term from query parameters

    try {
        let query = `
        SELECT Users.username, Posts.title, Posts.created_at, Posts.pdf
        FROM Posts
        JOIN Users ON Posts.userID = Users.userID
      `;

        let queryParams = [];

        // If there's a search term, add a WHERE clause
        if (search) {
            query += ` WHERE LOWER(Users.username) LIKE $1`;
            queryParams.push(`%${search.toLowerCase()}%`);
        }

        // Add ORDER BY, LIMIT, and OFFSET clauses
        query += `
        ORDER BY Posts.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
        queryParams.push(limit, offset);

        console.log("SEARCH: ", query);
        console.log(queryParams);
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({
            error: "An error occurred while fetching posts",
        });
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/postss", upload.single("pdf"), async (req, res) => {
    const { title, user_uuid } = req.body;
    const pdfBuffer = req.file ? req.file.buffer : null;

    if (!title || !pdfBuffer || !user_uuid) {
        return res.status(400).send("Title, PDF file, and userID are required.");
    }

    try {
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

        const url = "https://api.edenai.run/v2/workflow/e7035afa-c5fb-4e7e-ad0c-e41fc827e261/execution/";
        const formData = new FormData();
        
        formData.append('Resume', blob, 'Resume.pdf'); 
        
        const launchExecution = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.EDEN_AI_API_KEY}`
            },
            body: formData
        });
        const launchExecutionResults = await launchExecution.json();
        const executionId = launchExecutionResults.id;
        
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        await wait(5000);
        
        const url2 = `https://api.edenai.run/v2/workflow/e7035afa-c5fb-4e7e-ad0c-e41fc827e261/execution/${executionId}/`;
        const getExecution = await fetch(url2, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.EDEN_AI_API_KEY}`
            },
        });
        
        // Wait for 5 seconds after getting the response
        const apiData = await getExecution.json();
        await wait(5000); // Wait for 5 seconds here
        
        console.log(apiData.content.status);

        const pppoopoo = JSON.stringify(apiData.content.results.output, null, 2);

        const parsedData = JSON.parse(pppoopoo);
        const extractedData = parsedData.results[0]?.extracted_data;


        const educationSection = extractedData.education.entries[0]
        const gpa = educationSection.gpa; // Assuming you want the first entry
        const school = educationSection.establishment; // Assuming you want the first entry
        const major = educationSection.accreditation; // Assuming you want the first entry

        const companies = extractedData.work_experience?.entries?.map(entry => entry.company) || [];
        const companiesString = companies.join(', '); // Join companies into a single string


        const query = `
                    INSERT INTO Posts (title, pdf, created_at, userid, school, gpa, major, company)
                    VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7)
                `;
        const values = [title, pdfBuffer, user_uuid, school, gpa, major, companiesString];

        await pool.query(query, values);

        res.status(201).send("Post uploaded successfully!");
    } catch (error) {
        console.error("Error uploading post:", error);
        res.status(500).send("Failed to upload post.");
    }
});

const users = [
    {
        username: "testuser",
        password:
            "$2a$10$1C0PmG9y2rh9Y1uA2/O69uRhbA8e1zpxrqXXyExIQoZdv5t31/rUW", // bcrypt hashed password for 'testpassword'
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
            return res
                .status(500)
                .json({ success: false, message: err.message });
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: info.message });

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
    startWebSocketServer();
});
