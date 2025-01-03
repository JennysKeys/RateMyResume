let cardContainer = document.getElementById("card-container");
let loader = document.getElementById("loader");
var throttleTimer;

const HOME_PAGE = 0;
const POPULAR_PAGE = 1;
const FOLLOWER_PAGE = 2;

let offset = 0;
const limit = 2; //Number of posts to load per batch

const hostname = "0.0.0.0";
const port = 8080;

let cardNum = 0;
// Get references to the search input and button
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
// Variable to store the current search term
let currentSearchTerm = "";
let curr_user = "";
let notInUserDetails = true;
let currentProfileId = null;

async function getCurrentUserUUID() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error(
                "User is current not logged in. Token cannot be found"
            );
            return null;
        }
        const response = await fetch("/current-user", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const userId = await response.text();
        console.log("Current User UUID:", userId);
        return userId;
    } catch (error) {
        console.error("Error fetching current user UUID:", error);
    }
}

window.onload = async function () {
    notInUserDetails = true;
    currentProfileId = null;
    cardContainer = document.getElementById("card-container");
    curr_user = await getCurrentUserUUID();

    if (CURRENT_PAGE === HOME_PAGE) {
        loadPosts(false);
    } else if (CURRENT_PAGE === FOLLOWER_PAGE) {
        loadPosts(false, {}, true);
    }
    slideOne();
    slideTwo();
};

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

let CURRENT_PAGE = parseInt(localStorage.getItem("currentPage")) || HOME_PAGE;

let throttle = (callback, time) => {
    if (throttleTimer) return;

    throttleTimer = true;

    setTimeout(() => {
        callback();
        throttleTimer = false;
    }, time);
};

document.getElementById("homeNav").addEventListener("click", function () {
    console.log("hio");
    localStorage.setItem("currentPage", HOME_PAGE);
    window.location.reload();
});

document.getElementById("followersNav").addEventListener("click", function () {
    console.log("hio");
    localStorage.setItem("currentPage", FOLLOWER_PAGE);
    window.location.reload();
});

let createCardBtn = (icon, bottom, left, id, onClick) => {
    let button = document.createElement("button");
    button.className = "card-button";
    button.id = id;

    let btnIcon = document.createElement("i");
    btnIcon.className = icon;

    button.appendChild(btnIcon);

    button.style.position = "absolute";
    button.style.bottom = bottom;
    button.style.left = left;

    button.addEventListener("click", onClick);
    return button;
};

function timeSince(date) {
    const now = new Date();
    const postDate = new Date(date);
    const secondsPast = Math.floor((now - postDate) / 1000);

    if (secondsPast < 60) {
        return `${secondsPast} sec${secondsPast !== 1 ? "s" : ""} ago`;
    }
    if (secondsPast < 3600) {
        const minutes = Math.floor(secondsPast / 60);
        return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    }
    if (secondsPast < 86400) {
        const hours = Math.floor(secondsPast / 3600);
        return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
    }
    if (secondsPast < 2592000) {
        // 30 days
        const days = Math.floor(secondsPast / 86400);
        return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
    return `30+ days ago`;
}

async function getFollowingList() {
    let followingIds = [];
    url = `/get-followers?user_uuid=${curr_user}`;
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Network response was not ok " + response.statusText
            );
        }

        const body = await response.json();
        followingIds = body;
        followingIds = formatFollowingList(followingIds);
        console.log("followers: " + followingList);
        return followingIds;
    } catch (error) {
        console.log("Fetch error:", error);
    }
}

async function formatFollowingList(followingListBody) {
    followingList = [];
    for (let i = 0; i < followingListBody.length; i++) {
        followingList.push(followingListBody[i].followeduserid);
    }
    return followingList;
}

async function loadPosts(needFilter, filters, followersOnly) {
    try {
        const params = new URLSearchParams({
            limit: limit,
            offset: offset,
        });
        if (currentSearchTerm) {
            params.append("search", currentSearchTerm);
        }
        let followingList = await getFollowingList();
        console.log(followingList.length, "ehjfhf");

        if (followersOnly) {
            params.append("followingIds", followingList.join(","));
            params.append("currentUser_followers", curr_user);
        }
        if (!notInUserDetails && currentProfileId !== null) {
            console.log("profile details");
            params.append("currentPostUserName", currentProfileId);
        }

        params.append("currentUser", curr_user);
        params.append("viewersIds", followingList);

        let response;

        if (needFilter) {
            params.append("schools", filters.schools);
            params.append("gpaMin", filters.gpaMin);
            params.append("gpaMax", filters.gpaMax);
            params.append("majors", filters.majors);
            response = await fetch(`/filter?${params.toString()}`);
        } else {
            response = await fetch(`/posts?${params.toString()}`);
        }

        const posts = await response.json();
        console.log(posts.length, offset, limit);
        if (offset == 0) {
            cardContainer.innerHTML = "";
        }
        offset += limit;

        if (posts.length == 0) {
            // If no posts are returned and it's the first batch, display a message
            if (offset == limit) {
                const noResultsMessage = document.createElement("p");
                noResultsMessage.textContent = "No posts found.";
                noResultsMessage.style.marginLeft = "370px";
                cardContainer.appendChild(noResultsMessage);
            }
            removeInfiniteScroll();
            return;
        }

        posts.forEach((post, index) => {
            console.log(post.title);

            const card = document.createElement("div");
            card.className = "card";

            card.addEventListener("click", () => {
                showPostDetail(post);
            });

            // Header div for username and date
            const headerContainer = document.createElement("div");
            headerContainer.className = "card-header";

            const usernameElement = document.createElement("h3");
            usernameElement.textContent = post.username;
            usernameElement.style.cursor = "pointer";

            // Add an event listener for username click

            if (notInUserDetails) {
                usernameElement.addEventListener("click", (event) => {
                    event.stopPropagation();
                    showUserDetail(post.username, post.userid);
                });
            }

            const dateElement = document.createElement("p");
            dateElement.textContent = timeSince(post.created_at);

            headerContainer.appendChild(usernameElement);
            headerContainer.appendChild(dateElement);

            // Div container for the title of the post
            const titleContainer = document.createElement("div");
            titleContainer.className = "card-title";

            const titleElement = document.createElement("h2");
            titleElement.textContent = post.title;
            titleContainer.appendChild(titleElement);

            const pdfContainer = document.createElement("div");
            pdfContainer.style.width = "100%";
            pdfContainer.style.height = "450px";
            pdfContainer.style.overflow = "auto";
            pdfContainer.style.borderBottom = "1px solid #ccc"; // Add border below PDF
            const canvas = document.createElement("canvas");
            canvas.style.width = "100%"; // Make canvas full width
            canvas.style.flexGrow = "1"; // Allow canvas to grow
            pdfContainer.appendChild(canvas);

            if (post.pdf && post.pdf.data) {
                const loadingTask = pdfjsLib.getDocument({
                    data: post.pdf.data,
                });
                loadingTask.promise
                    .then((pdf) => {
                        pdf.getPage(1).then((page) => {
                            const desiredWidth = pdfContainer.clientWidth;
                            const scale =
                                desiredWidth /
                                page.getViewport({ scale: 1 }).width;
                            const viewport = page.getViewport({
                                scale: scale,
                            });

                            canvas.width = viewport.width;
                            canvas.height = viewport.height;

                            const renderContext = {
                                canvasContext: canvas.getContext("2d"),
                                viewport: viewport,
                            };
                            page.render(renderContext);
                        });
                    })
                    .catch((error) => {
                        console.error("Error loading PDF:", error);
                        const errorMessage = document.createElement("p");
                        errorMessage.textContent = "Failed to load PDF.";
                        pdfContainer.appendChild(errorMessage);
                    });
            } else {
                console.warn("PDF data is missing for post:", post);
                const errorMessage = document.createElement("p");
                errorMessage.textContent = "PDF data is unavailable.";
                pdfContainer.appendChild(errorMessage);
            }

            card.appendChild(headerContainer);
            card.appendChild(document.createElement("hr"));
            card.appendChild(titleContainer);
            card.appendChild(pdfContainer);

            // Create buttons container
            const buttonsContainer = document.createElement("div");
            // buttonsContainer.style.borderTop = "2px solid #ccc"; // Add border above buttons
            // buttonsContainer.style.paddingTop = "10px"; // Add some padding
            buttonsContainer.className = "buttonsContainer"; // Use a class for styling

            // let buttonUp = createCardBtn(
            //     "fas fa-arrow-up",
            //     "10px",
            //     "10px",
            //     `buttonUp${index + offset}`,
            //     () => console.log("up button clicked")
            // );
            // let buttonDown = createCardBtn(
            //     "fas fa-arrow-down",
            //     "10px",
            //     "50px",
            //     `buttonDown${index + offset}`,
            //     () => console.log("down button clicked")
            // );
            let buttonComment = createCardBtn(
                "fas fa-comment",
                "10px",
                "10px",
                `buttonComment${index + offset}`,
                () => console.log("comment button clicked")
            );
            // let buttonSave = createCardBtn(
            //     "fas fa-bookmark",
            //     "10px",
            //     "130px",
            //     `buttonSave${index + offset}`,
            //     () => console.log("save button clicked")
            // );
            // let buttonShare = createCardBtn(
            //     "fas fa-share",
            //     "10px",
            //     "170px",
            //     `buttonShare${index + offset}`,
            //     () => console.log("share button clicked")
            // );

            //buttonsContainer.appendChild(buttonUp);
            //buttonsContainer.appendChild(buttonDown);
            buttonsContainer.appendChild(buttonComment);
            //buttonsContainer.appendChild(buttonSave);
            //buttonsContainer.appendChild(buttonShare);

            card.appendChild(buttonsContainer);
            cardContainer.appendChild(card);
        });

        if (posts.length < limit) {
            removeInfiniteScroll();
        }
    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

async function showPostDetail(post) {
    const mainContainer = document.getElementById("main");
    fetch("postDetail.html")
        .then((response) => response.text())
        .then(async (html) => {
            mainContainer.innerHTML = html;

            const titleElement = document.getElementById("post-title");
            const pdfContainer = document.getElementById("pdf-container");
            const usernameElement = document.getElementById("username");
            const dateElement = document.getElementById("date");
            const postIdElement = document.getElementById("postId");

            titleElement.textContent = post.title;
            usernameElement.textContent = post.username;
            dateElement.textContent = timeSince(post.created_at);
            postIdElement.value = post.postid;

            const comments = await fetchComments(post.postid);
            displayComments(comments);

            // Render the PDF
            const canvas = document.createElement("canvas");
            canvas.style.width = "100%";
            pdfContainer.appendChild(canvas);

            if (post.pdf && post.pdf.data) {
                const loadingTask = pdfjsLib.getDocument({
                    data: post.pdf.data,
                });
                loadingTask.promise
                    .then((pdf) => {
                        pdf.getPage(1).then((page) => {
                            const viewport = page.getViewport({ scale: 1 });

                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            const renderContext = {
                                canvasContext: canvas.getContext("2d"),
                                viewport: viewport,
                            };
                            page.render(renderContext);
                        });
                    })
                    .catch((error) => {
                        console.error("Error loading PDF:", error);
                        const errorMessage = document.createElement("p");
                        errorMessage.textContent = "Failed to load PDF.";
                        pdfContainer.appendChild(errorMessage);
                    });
            } else {
                console.warn("PDF data is missing for post:", post);
                const errorMessage = document.createElement("p");
                errorMessage.textContent = "PDF data is unavailable.";
                pdfContainer.appendChild(errorMessage);
            }
            window.removeEventListener("scroll", handleInfiniteScroll);
        })
        .catch((error) => {
            console.error("Error loading post detail:", error);
        });
}

async function showUserDetail(username, userid) {
    notInUserDetails = false;
    currentProfileId = userid;
    const mainContainer = document.getElementById("main");

    try {
        const response = await fetch("userDetail.html");
        const html = await response.text();
        mainContainer.innerHTML = html;

        let followingList = await getFollowingList();

        if (followingList.includes(currentProfileId)) {
            const followButton = document.getElementById("follow-button");
            followButton.innerHTML = "Unfollow";
            followButton.style.backgroundColor = "gray";
        }

        const userNameElement = document.getElementById("floating-user-name");
        userNameElement.textContent = username;
        inProfile = true;
        cardContainer = document.getElementById("card-container2");
        loadPosts(false, {}, false, userid);

        const followButton = document.getElementById("follow-button");
        const chatButton = document.getElementById("chat-button");

        if (currentProfileId === curr_user) {
            followButton.disabled = true;
            followButton.style.display = "none";
            chatButton.style.display = "none";
        } else {
            followButton.addEventListener("click", async () => {
                const action =
                    followButton.innerHTML === "Follow" ? "follow" : "unfollow";
                const response = await fetch("/follow", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: action,
                        following_username: curr_user,
                        followed_username: username,
                    }),
                });

                if (response.ok) {
                    if (action === "follow") {
                        followButton.innerHTML = "Unfollow";
                        followButton.style.backgroundColor = "gray";
                    } else {
                        followButton.innerHTML = "Follow";
                        followButton.style.backgroundColor = "";
                    }
                    console.log(`Follow button clicked for user: ${username}`);
                } else {
                    console.error("Failed to update follow status");
                }
            });
        }
    } catch (error) {
        console.error("Error loading user detail:", error);
        mainContainer.innerHTML = "<p>Failed to load user details.</p>";
    }
}

function displayComments(comments) {
    const commentsSection = document.getElementById("commentsSection");
    commentsSection.innerHTML = ""; // Clear existing comments

    // Sort comments by created_at date (newest first)
    comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    comments.forEach((comment) => {
        // Create the main comment div
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";

        // Create the comment header
        const commentHeader = document.createElement("div");
        commentHeader.className = "comment-header";

        // Create and append username
        const usernameSpan = document.createElement("span");
        usernameSpan.className = "username";
        usernameSpan.textContent = comment.username;
        commentHeader.appendChild(usernameSpan);

        // Create and append timestamp
        const timestampSpan = document.createElement("span");
        timestampSpan.className = "timestamp";
        timestampSpan.textContent = timeSince(comment.created_at);
        commentHeader.appendChild(timestampSpan);

        // Create and append the comment body
        const commentBody = document.createElement("div");
        commentBody.className = "comment-body";
        commentBody.textContent = comment.body;

        // Create comment buttons container
        const commentButtons = document.createElement("div");
        commentButtons.className = "comment-buttons";
        // Add buttons for reply or delete if needed (you can create buttons here)

        // Append all parts to the main comment div
        commentDiv.appendChild(commentHeader);
        commentDiv.appendChild(commentBody);
        commentDiv.appendChild(commentButtons);

        // Finally, append the comment div to the comments section
        commentsSection.appendChild(commentDiv);
    });
}

async function fetchComments(postId) {
    try {
        const response = await fetch(`/comments/${postId}`);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const comments = await response.json();
        return comments;
    } catch (error) {
        console.error("Error fetching comments:", error);
        return []; // Return an empty array on error
    }
}

let handleInfiniteScroll = () => {
    throttle(() => {
        let endOfPage =
            window.innerHeight + window.pageYOffset >=
            document.body.offsetHeight - 30;

        if (endOfPage) {
            if (CURRENT_PAGE === HOME_PAGE) {
                loadPosts(false);
            } else if (CURRENT_PAGE === FOLLOWER_PAGE) {
                loadPosts(false, {}, true);
            } else if (!notInUserDetails && currentProfileId != null) {
                loadPosts(false, {}, false, currentProfileId);
            }
        }
    }, 100);
};

let removeInfiniteScroll = () => {
    loader.remove();
    window.removeEventListener("scroll", handleInfiniteScroll);
};

window.addEventListener("scroll", handleInfiniteScroll);

searchButton.addEventListener("click", () => {
    currentSearchTerm = searchInput.value.trim();

    // Reset offset and clear existing posts
    offset = 0;
    cardContainer.innerHTML = "";

    // Re-add the infinite scroll event listener if it was removed
    window.removeEventListener("scroll", handleInfiniteScroll);
    window.addEventListener("scroll", handleInfiniteScroll);

    // Load posts with the new search term
    loadPosts(false);
});

const pdfDisplay = document.getElementById("pdfDisplay");
const createPostPage = document.getElementById("createButton");
const post = document.getElementById("postButtom");

createPostPage.addEventListener("click", function () {
    const mainContainer = document.getElementById("main");

    fetch("createPost.html")
        .then((response) => response.text())
        .then((html) => {
            mainContainer.innerHTML = html;
            const inputPDF = document.getElementById("inputPDF");
            const postButton = document.getElementById("postButton");

            const removeButton = document.getElementById("removeButton");

            inputPDF.addEventListener("change", handleFiles);
            postButton.addEventListener("click", uploadPost);
            removeButton.addEventListener("click", removePost);
        });
});

let selectedFile = null;

function handleFiles(event) {
    const files = event.target.files;
    if (files.length > 0) {
        selectedFile = files[0];
        if (selectedFile.type === "application/pdf") {
            const fileURL = URL.createObjectURL(selectedFile);

            const pdfDisplay = document.createElement("iframe");
            pdfDisplay.src = fileURL;

            const dropFileInputContainer = document.getElementById("dropArea");
            dropFileInputContainer.innerHTML = ""; // Clear previous content
            dropFileInputContainer.appendChild(pdfDisplay);

            // Show the Remove PDF button
            document.getElementById("removeButton").style.display =
                "inline-block";
        } else {
            alert("Please upload a valid PDF file.");
        }
    }
}

async function uploadPost() {
    let friendsOnly = document.getElementById("friends-only");
    const titleInput = document.getElementById("title");
    const title = titleInput.value.trim();
    const errorMessageDiv = document.getElementById("errorMessage");
    const successMessageDiv = document.getElementById("successMessage");

    // Clear previous messages
    errorMessageDiv.textContent = "";
    successMessageDiv.textContent = "";

    if (!title) {
        errorMessageDiv.textContent = "Please enter a title.";
        return;
    }

    if (!selectedFile) {
        errorMessageDiv.textContent = "Please upload a PDF file.";
        return;
    }

    const userUUID = curr_user;
    const createdAt = new Date().toISOString();
    let friends_only = friendsOnly.checked;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("pdf", selectedFile);
    formData.append("created_at", createdAt);
    formData.append("user_uuid", userUUID);
    formData.append("friends_only", friends_only);

    try {
        const response = await fetch("/postss", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const data = await response.json(); // Get the response data
            const postId = data.postId; // Extract the postId

            // Call the processing function
            processPost(postId);

            // Reset the input fields
            titleInput.value = "";
            selectedFile = null;

            // Reset the drop area
            const dropArea = document.getElementById("dropArea");
            dropArea.textContent = "";
            const label = document.createElement("label");
            label.setAttribute("for", "inputPDF");
            label.id = "drop-area";

            const input = document.createElement("input");
            input.id = "inputPDF";
            input.type = "file";
            input.accept = ".pdf";
            input.hidden = true;

            const pdfView = document.createElement("div");
            pdfView.id = "pdf-view";
            while (pdfView.firstChild) {
                pdfView.removeChild(pdfView.firstChild);
            }

            const newParagraph = document.createElement("p");
            const textBeforeBr = document.createTextNode(
                "Drag and Drop or Click here"
            );
            const newBr = document.createElement("br");
            const textAfterBr = document.createTextNode("to upload PDF");

            newParagraph.appendChild(textBeforeBr);
            newParagraph.appendChild(newBr);
            newParagraph.appendChild(textAfterBr);
            pdfView.appendChild(newParagraph);

            const newSpan = document.createElement("span");
            newSpan.className = "bottom-text";
            newSpan.textContent = "Upload any PDF from desktop";

            pdfView.appendChild(newParagraph);
            pdfView.appendChild(newSpan);
            label.appendChild(input);
            label.appendChild(pdfView);
            dropArea.appendChild(label);
            input.addEventListener("change", handleFiles);

            successMessageDiv.textContent = "Post uploaded successfully!";
        } else {
            errorMessageDiv.textContent = "Failed to upload post.";
        }
    } catch (error) {
        errorMessageDiv.textContent = "An error occurred: " + error.message;
    }
}

async function processPost(postId) {
    try {
        const processResponse = await fetch(`/process/${postId}`, {
            method: "POST",
        });

        if (processResponse.ok) {
            console.log("Post processed successfully!");
            // You can also update the UI or show a success message here
        } else {
            console.error("Failed to process the post.");
        }
    } catch (error) {
        console.error("Error processing post:", error);
    }
}

function removePost() {
    selectedFile = null; // Clear the selected file
    selectedFile = null;

    const dropArea = document.getElementById("dropArea");
    dropArea.textContent = "";

    const label = document.createElement("label");
    label.setAttribute("for", "inputPDF");
    label.id = "drop-area";

    const input = document.createElement("input");
    input.id = "inputPDF";
    input.type = "file";
    input.accept = ".pdf";
    input.hidden = true;

    const pdfView = document.createElement("div");
    pdfView.id = "pdf-view";
    while (pdfView.firstChild) {
        pdfView.removeChild(pdfView.firstChild);
    }

    const newParagraph = document.createElement("p");
    const textBeforeBr = document.createTextNode("Drag and Drop or Click here");
    const newBr = document.createElement("br");
    const textAfterBr = document.createTextNode("to upload PDF");

    newParagraph.appendChild(textBeforeBr);
    newParagraph.appendChild(newBr);
    newParagraph.appendChild(textAfterBr);
    pdfView.appendChild(newParagraph);

    const newSpan = document.createElement("span");
    newSpan.className = "bottom-text";
    newSpan.textContent = "Upload any PDF from desktop";

    pdfView.appendChild(newParagraph);
    pdfView.appendChild(newSpan);
    label.appendChild(input);
    label.appendChild(pdfView);
    dropArea.appendChild(label);
    input.addEventListener("change", handleFiles);

    // Reattach the event listener to the new input
    const inputPDF = document.getElementById("inputPDF");
    inputPDF.addEventListener("change", handleFiles);

    // Hide the Remove PDF button
    document.getElementById("removeButton").style.display = "none";
}

function expandCommentInput() {
    document.getElementById("smallCommentInput").style.display = "none";
    document.getElementById("largeCommentInput").style.display = "block";
}

function cancelComment() {
    document.getElementById("largeCommentInput").style.display = "none";
    document.getElementById("smallCommentInput").style.display = "block";
    document.getElementById("commentTextArea").value = ""; // Clear the textarea
}
async function submitComment() {
    const commentText = document.getElementById("commentTextArea").value;
    const postId = document.getElementById("postId").value;

    if (!commentText) {
        alert("Please enter a comment before submitting.");
        return;
    }

    try {
        const response = await fetch(`/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                postId: postId,
                comment: commentText,
            }),
        });

        if (response.ok) {
            console.log("Comment submitted successfully.");
            const newComment = await response.json();

            document.getElementById("commentTextArea").value = "";
            document.getElementById("largeCommentInput").style.display = "none";
            document.getElementById("smallCommentInput").style.display =
                "block";

            const existingCommentsResponse = await fetch(`/comments/${postId}`);
            const existingComments = await existingCommentsResponse.json();

            // const allComments = [...existingComments, newComment];

            displayComments(existingComments);
        } else {
            console.error("Failed to submit comment:", response.statusText);
        }
    } catch (error) {
        console.error("Error submitting comment:", error);
    }
}
