let current_user = "49b6e479-fab2-4e6e-a2ed-3f7c5950ab9d";
let current_receiver = "";
const messageContainer = document.getElementById("message-container");

let idToUserName = {
    "49b6e479-fab2-4e6e-a2ed-3f7c5950ab9d": "Test User",
};

const ws = new WebSocket(
    "ws://localhost:3001/?userID=" + encodeURIComponent(current_user)
);

ws.onopen = (event) => {
    console.log("Connected to WS");
};

ws.onmessage = (event) => {
    console.log("hi");
    let msgData = JSON.parse(event.data);
    console.log(msgData);
    console.log(current_user, msgData.receiverID);
    console.log(current_receiver, msgData.sender_id);

    if (
        msgData.receiver_id === current_user &&
        msgData.sender_id === current_receiver
    ) {
        console.log("ion here");
        let div = document.createElement("div");
        div.textContent = `${idToUserName[msgData.sender_id]}: ${
            msgData.content
        }`;
        messageContainer.appendChild(div);
        scrollToBottom();
    }
};

ws.onclose = (event) => {
    console.log("Disconnected from WebSocket server");
};

async function getFollowers() {
    const url = "/database";
    let followers = [];

    try {
        const response = await fetch(url);
        console.log("Received response headers");

        if (!response.ok) {
            throw new Error("Error: " + response.statusText);
        }

        const body = await response.json();

        for (let i = 0; i < body.length; i++) {
            if (body[i].userid !== current_user) {
                followers.push(body[i]);
            }
        }
    } catch (error) {
        console.log("Fetch error:", error);
    }
    return followers;
}

async function openFollowersList() {
    document.getElementById("myForm").style.display = "block";
    await populateFollowersList();
}

function closeFollowersList() {
    document.getElementById("myForm").style.display = "none";
}

async function populateFollowersList() {
    const followersList = document.getElementById("followers-list");
    followersList.textContent = "";
    let followers = await getFollowers();

    if (followers.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "No followers to display.";
        followersList.appendChild(emptyMessage);
    } else {
        followers.forEach((follower) => {
            const li = document.createElement("li");
            li.textContent = follower.username;

            const button = document.createElement("button");
            button.classList.add("open-private-msg");

            let btnIcon = document.createElement("i");
            btnIcon.className = "fas fa-comment";

            button.appendChild(btnIcon);
            idToUserName[follower.userid] = follower.username;
            button.onclick = async () =>
                await openPrivateMsg(current_user, follower.userid);

            li.appendChild(button);
            followersList.appendChild(li);
        });
    }
}

async function openPrivateMsg(senderID, receiverID) {
    document.getElementById("privateMsgForm").style.display = "block";
    document.getElementById("message-container").textContent = "";
    current_receiver = receiverID;
    await loadMessages(senderID, receiverID);
}

function closePrivateMsg() {
    document.getElementById("privateMsgForm").style.display = "none";
}

async function fetchMessages(senderID, receiverID) {
    messages = [];
    url = `/get-messages?senderID=${senderID}&receiverID=${receiverID}`;
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Network response was not ok " + response.statusText
            );
        }

        const body = await response.json();
        messages = body;
    } catch (error) {
        console.log("Fetch error:", error);
    }
    return messages;
}

async function sendMessage(senderID, receiverID, content) {
    const url = "/send-message";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                senderID: senderID,
                receiverID: receiverID,
                content: content,
            }),
        });
        if (!response.ok) {
            throw new Error("Error: " + response.statusText);
        }
        const result = await response.json();
        await loadMessages(senderID, receiverID);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

document
    .getElementById("send-message-form")
    .addEventListener("submit", async (event) => {
        event.preventDefault();

        let content = document.getElementById("message-content").value;

        if (content.length > 0) {
            await sendMessage(current_user, current_receiver, content);
            document.getElementById("message-content").value = "";
        }
    });

async function loadMessages(senderID, receiverID) {
    messageContainer.textContent = "";
    const messages = await fetchMessages(senderID, receiverID);

    messages.forEach((message) => {
        const div = document.createElement("div");
        div.textContent = `${idToUserName[message.sender_id]}: ${
            message.content
        }`;
        messageContainer.appendChild(div);
        scrollToBottom();
    });
}

function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
}
