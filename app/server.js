const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const LocalStrategy = require("passport-local").Strategy;

const multer = require("multer");

const app = express();

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const url = require("url");

const port = parseInt(process.env.PORT) || 8080;
const hostname = "0.0.0.0";

// if(process.env.NODE_ENV == "production") {
//     hostname = "0.0.0.0";
// }

const dotenv = require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;
const cors = require("cors");
const { Pool } = require("pg");

const path = require("path");
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(passport.initialize());

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

io.on("connection", (socket) => {
    console.log("Client connected");

    let queryParams = url.parse(socket.handshake.url, true).query;
    let userID = queryParams.userID;
    socket.userID = userID;

    socket.on("message", (message) => {
        let parsedMessage = JSON.parse(message);
        io.sockets.sockets.forEach((client) => {
            if (client.userID === parsedMessage.receiverID) {
                client.send(parsedMessage);
            }
        });
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// server.listen(port, () => {
//     console.log(`Socket.io server running on port ${port}`);
// });

function broadcastMessage2(message) {
    console.log(message);
    console.log("hello");

    io.sockets.sockets.forEach((client) => {
        console.log(client.userID);
        if (client.userID === message.receiver_id) {
            console.log(client.userID);
            console.log("sending msg");
            client.send(JSON.stringify(message));
        }
    });
}

app.get("/database", async (req, res) => {
    //console.log("connected");
    const client = await pool.connect();
    try {
        const result = await pool.query("SELECT * FROM users");
        //console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        //console.log(error);
    } finally {
        client.release();
    }
    res.status(404);
});

app.get("/filter", async (req, res) => {
    let startWhere = true;
    const limit = parseInt(req.query.limit) || 2; // Number of posts to load per batch
    const offset = parseInt(req.query.offset) || 0; // Offset to start fetching posts from
    const search = req.query.search || ""; // Get the search term from query parameters
    let schoolString = req.query.schools || "";
    let schools = schoolString.split(",");
    let majorString = req.query.majors || "";
    let majors = majorString.split(",");
    let gpaMin = req.query.gpaMin || "";
    let gpaMax = req.query.gpaMax || "";

    //console.log(schools);

    try {
        let query = `
        SELECT Posts.title, Posts.created_at, Posts.school, Posts.major, Posts.gpa, Posts.pdf
        FROM Posts
      `;

        let queryParams = [];
        let parmsCount = 1;

        if (search || schoolString || majorString || gpaMin) {
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
            let firstSchool = true;
            if (!startWhere) {
                query += " AND";
            }
            for (school of schools) {
                if (!firstSchool) {
                    query += " OR";
                } else {
                    query += "(";
                }
                query += ` LOWER(Posts.school) LIKE $${parmsCount}`;
                parmsCount++;
                queryParams.push(`%${school.toLowerCase()}%`);
                firstSchool = false;
                startWhere = false;
            }
            query += ")";
        }

        if (majorString) {
            let firstMajor = true;
            if (!startWhere) {
                query += " AND";
            }
            for (major of majors) {
                if (!firstMajor) {
                    query += " OR";
                } else {
                    query += "(";
                }
                query += ` LOWER(Posts.major) LIKE $${parmsCount}`;
                queryParams.push(`%${major.toLowerCase()}%`);
                parmsCount++;
                firstMajor = false;
                startWhere = false;
            }
            query += ")";
        }

        if (gpaMin) {
            if (!startWhere) {
                query += " AND";
            }

            query += ` (Posts.gpa >= ${gpaMin} AND Posts.gpa <= ${gpaMax})`;
        }

        // Add ORDER BY, LIMIT, and OFFSET clauses
        query += `
        ORDER BY Posts.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
        queryParams.push(limit, offset);

        //console.log(gpaMin);
        //console.log(query);
        //console.log(queryParams);
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching filtered posts:", error);
        res.status(500).json({
            error: "An error occurred while fetching filtered posts",
        });
    }
});

app.get("/get-followers", async (req, res) => {
    const { user_uuid } = req.query;
    const client = await pool.connect();

    try {
        const result = await client.query(
            "SELECT * FROM follows WHERE (followinguserid = $1)",
            [user_uuid]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error getting followers:", err);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release();
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
        //console.log("Query result:", result.rows);
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
        broadcastMessage2(message);
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
    const currentPostUserName = req.query.currentPostUserName || ""; // Get the search term from query parameters
    const currentUser = req.query.currentUser || ""; // Get the search term from query parameters
    const currentUser_followers = req.query.currentUser_followers || ""; // Get the search term from query parameters
    const followingIds = req.query.followingIds || ""; // Get the search term from query parameters
    const viewersIds = req.query.viewersIds || ""; // Get the search term from query parameters

    //console.log("id top" + followingIds);
    try {
        let query = `
        SELECT Users.username, Posts.title, Posts.created_at, Posts.pdf, Posts.postid, Posts.userid, Posts.friends_only
        FROM Posts
        JOIN Users ON Posts.userid = Users.userID
      `;

        let queryParams = [];
        let whereConditions = [];

        // If there's a search term, add a WHERE clause
        if (search) {
            whereConditions.push(`LOWER(Users.username) LIKE $1`);
            queryParams.push(`%${search.toLowerCase()}%`);
        }

        if (currentUser_followers) {
            if (followingIds.length > 0) {
                const idArr = followingIds.split(",");
                //console.log("ids: " + idArr);
                whereConditions.push(
                    `CAST(Posts.userid AS text) = ANY ($1::text[])`
                );
                queryParams.push(idArr);
            } else {
                return res.json([]);
            }
        }
        if (currentPostUserName) {
            //console.log("HELLO");
            //console.log("loading posts for: " + currentPostUserName);
            whereConditions.push(`Posts.userid = $1`);
            queryParams.push(currentPostUserName);
        }

        if (currentUser) {
            if (viewersIds.length > 0) {
                //console.log("checking in here");
                const viewersArr = viewersIds.split(",");

                if (currentUser_followers) {
                    let justViewers = viewersIds.split(",");
                    justViewers = justViewers.filter(
                        (item) => item !== currentUser_followers
                    );
                    whereConditions.push(
                        `(Posts.friends_only = FALSE OR (Posts.friends_only = TRUE AND CAST(Posts.userid AS text) = ANY ($${
                            queryParams.length + 1
                        }::text[])))`
                    );
                    queryParams.push(justViewers);
                } else {
                    whereConditions.push(
                        `(Posts.friends_only = FALSE OR (Posts.friends_only = TRUE AND (Posts.userid = $${
                            queryParams.length + 1
                        } OR CAST(Posts.userid AS text) = ANY ($${
                            queryParams.length + 2
                        }::text[]))))`
                    );
                    queryParams.push(currentUser, viewersArr);
                }
            } else {
                // If viewersIds is empty, only show public posts or the user's own posts
                whereConditions.push(
                    `(Posts.friends_only = FALSE OR Posts.userid = $${
                        queryParams.length + 1
                    })`
                );
                queryParams.push(currentUser);
            }
        }
        if (whereConditions.length > 0) {
            query += " WHERE " + whereConditions.join(" AND ");
        }

        // Add ORDER BY, LIMIT, and OFFSET clauses
        query += `
        ORDER BY Posts.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
        queryParams.push(limit, offset);

        //console.log("SEARCH: ", query);
        //console.log(queryParams);
        const result = await pool.query(query, queryParams);
        //console.log(result.rows);
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
    const { title, user_uuid, friends_only } = req.body;
    const pdfBuffer = req.file ? req.file.buffer : null;

    if (!title || !pdfBuffer || !user_uuid || !friends_only) {
        return res
            .status(400)
            .send("Title, PDF file, and userID are required.");
    }

    try {
        const query = `
            INSERT INTO Posts (title, pdf, created_at, userid, friends_only)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4) RETURNING postid
        `;
        const values = [title, pdfBuffer, user_uuid, friends_only];
        const result = await pool.query(query, values);
        const postId = result.rows[0].postid;

        res.status(201).json({ postId });
    } catch (error) {
        console.error("Error uploading post:", error);
        res.status(500).send("Failed to upload post.");
    }
});

app.post("/process/:postId", async (req, res) => {
    const { postId } = req.params;

    //console.log(postId);
    try {
        // Fetch the PDF from the database using postId
        const query = `SELECT pdf FROM Posts WHERE postid = $1`;
        const result = await pool.query(query, [postId]);
        const pdfBuffer = result.rows[0]?.pdf;

        if (!pdfBuffer) {
            return res.status(404).send("PDF not found.");
        }

        // Call the external API to process the PDF
        const blob = new Blob([pdfBuffer], { type: "application/pdf" });
        const apiUrl =
            "https://api.edenai.run/v2/workflow/e7035afa-c5fb-4e7e-ad0c-e41fc827e261/execution/";
        const formData = new FormData();
        formData.append("Resume", blob, "Resume.pdf");

        const launchExecution = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.EDEN_AI_API_KEY}`,
            },
            body: formData,
        });

        const launchExecutionResults = await launchExecution.json();
        const executionId = launchExecutionResults.id;

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const getExecutionUrl = `https://api.edenai.run/v2/workflow/e7035afa-c5fb-4e7e-ad0c-e41fc827e261/execution/${executionId}/`;
        const getExecution = await fetch(getExecutionUrl, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.EDEN_AI_API_KEY}`,
            },
        });

        await new Promise((resolve) => setTimeout(resolve, 10000));

        const apiData = await getExecution.json();

        //console.log(apiData.content.status);

        const pppoopoo = JSON.stringify(
            apiData.content.results.output,
            null,
            2
        );

        const parsedData = JSON.parse(pppoopoo);
        const extractedData = parsedData.results[0]?.extracted_data;

        const educationSection = extractedData.education.entries[0];
        const gpa = educationSection.gpa;
        const school = educationSection.establishment;
        const major = educationSection.accreditation;

        const companies =
            extractedData.work_experience?.entries?.map(
                (entry) => entry.company
            ) || [];
        const companiesString = companies.join(", ");

        const updateQuery = `
            UPDATE Posts
            SET gpa = $1, major = $2, school = $3, company = $4
            WHERE postid = $5
        `;
        const updateValues = [gpa, major, school, companiesString, postId];
        await pool.query(updateQuery, updateValues);

        res.status(200).send("Post processed successfully!");
    } catch (error) {
        console.error("Error processing post:", error);
        res.status(500).send("Failed to process post.");
    }
});

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const result = await pool.query(
                "SELECT username, hash FROM users WHERE username = $1",
                [username]
            );

            if (result.rows.length === 0) {
                return done(null, false, { message: "Invalid credentials" });
            }

            const user = result.rows[0];

            const isMatch = await bcrypt.compare(password, user.hash);
            if (!isMatch) {
                return done(null, false, { message: "Invalid credentials" });
            }

            return done(null, user);
        } catch (error) {
            console.error("Error during authentication:", error);
            return done(error);
        }
    })
);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token)
        return res
            .status(401)
            .json({ message: "Access denied. Token missing." });

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token." });
        req.user = user; // Attach decoded token payload to request object
        next();
    });
};

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
        //console.log(user);
        const token = jwt.sign(
            { userid: user.userid, username: user.username },
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

app.post("/comments", async (req, res) => {
    const { comment, postId } = req.body;
    const userid = "49b6e479-fab2-4e6e-a2ed-3f7c5950ab9d";

    try {
        const result = await pool.query(
            "INSERT INTO comments (body, created_at, resumeid, userid) VALUES ($1, CURRENT_TIMESTAMP, $2, $3) RETURNING *",
            [comment, postId, userid]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error saving comment:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/comments/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
        const result = await pool.query(
            `SELECT c.commentID, c.body, c.created_at, c.resumeID, c.userID, u.username
             FROM Comments c
             JOIN Users u ON c.userID = u.userID
             WHERE c.resumeID = $1
             ORDER BY c.created_at DESC`,
            [postId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/create-user", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }

    try {
        // Check if username already exists
        const userCheck = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into database
        const result = await pool.query(
            "INSERT INTO users (username, hash) VALUES ($1, $2) RETURNING *",
            [username, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: { id: result.rows[0].id, username: result.rows[0].username },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            error: "An error occurred while creating the user",
        });
    }
});

app.use("/test-authenticate-token", authenticateToken);
app.get("/test-authenticate-token", (req, res) => {
    res.json({
        message: "You have access to /test-authenticate-token!",
        user: req.user,
    });
});

app.use("/current-user", authenticateToken);

app.get("/current-user", authenticateToken, async (req, res) => {
    console.log("hi");
    const getUserUUID = async (username) => {
        const query = "SELECT userID FROM Users WHERE username = $1";
        const values = [username];
        const client = await pool.connect();
        try {
            const result = await client.query(query, values);
            return result.rows[0].userid;
        } finally {
            client.release();
        }
    };

    try {
        const userUUID = await getUserUUID(req.user.username);
        res.send(userUUID);
    } catch (error) {
        console.error("Error fetching user UUID:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/current-username", authenticateToken, (req, res) => {
    console.log(req.user);
    res.send(req.user.username);
});

app.post("/follow", async (req, res) => {
    console.log("trying to follow");
    const client = await pool.connect();

    const { action, following_username, followed_username } = req.body;

    try {
        // Get the UUIDs of the users from the Users table
        const getUserUUID = async (username) => {
            const query = "SELECT userID FROM Users WHERE username = $1";
            const values = [username];
            const client = await pool.connect();
            try {
                const result = await client.query(query, values);
                return result.rows[0].userid;
            } finally {
                client.release();
            }
        };

        const followed_user_id = await getUserUUID(followed_username);
        const following_user_id = following_username;

        console.log(followed_user_id);
        console.log(following_user_id);

        if (action === "follow") {
            const query = `
                INSERT INTO Follows (created_at, followingUserID, followedUserID)
                VALUES (NOW(), $1, $2)
            `;
            const values = [following_user_id, followed_user_id];
            await client.query(query, values);
        } else if (action === "unfollow") {
            const query = `
                DELETE FROM Follows
                WHERE followingUserID = $1 AND followedUserID = $2
            `;
            const values = [following_user_id, followed_user_id];
            await client.query(query, values);
        }
        res.status(200).send("Success");
    } catch (err) {
        console.error("Error updating follow status:", err);
        res.status(500).send("Error");
    }
});

server.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
    console.log(`Socket.io server running on port ${port}`);
});
