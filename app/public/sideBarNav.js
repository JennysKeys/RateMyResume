let cardNum = 0;
// Get references to the search input and button
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
// Variable to store the current search term
let currentSearchTerm = "";

function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}

let cardContainer = document.getElementById("card-container");
let loader = document.getElementById("loader");

var throttleTimer;

let throttle = (callback, time) => {
  if (throttleTimer) return;

  throttleTimer = true;

  setTimeout(() => {
    callback();
    throttleTimer = false;
  }, time);
};

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

let offset = 0;
const limit = 2; //Number of posts to load per batch

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

async function loadPosts(needFilter, filters) {
  try {
    const params = new URLSearchParams({
      limit: limit,
      offset: offset,
    });
    if (currentSearchTerm) {
      params.append("search", currentSearchTerm);
    }
    let response;
    
    if(needFilter) {
      params.append("schools", filters.schools);
      params.append("gpas", filters.gpas);
      params.append("majors", filters.majors);
      response = await fetch(
        `http://localhost:3000/filter?${params.toString()}`
      );
    } else {
      response = await fetch(
        `http://localhost:3000/posts?${params.toString()}`
      );
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

      // Header div for username and date
      const headerContainer = document.createElement("div");
      headerContainer.className = "card-header";
      const usernameElement = document.createElement("h3");
      usernameElement.textContent = post.username;
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
        const loadingTask = pdfjsLib.getDocument({ data: post.pdf.data });
        loadingTask.promise.then(pdf => {
            pdf.getPage(1).then(page => {
                const desiredWidth = pdfContainer.clientWidth; 
                const scale = desiredWidth / page.getViewport({ scale: 1 }).width; 
                const viewport = page.getViewport({ scale: scale }); 
    
                canvas.width = viewport.width; 
                canvas.height = viewport.height; 
    
                const renderContext = {
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                };
                page.render(renderContext);
            });
        }).catch(error => {
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

      

      let buttonUp = createCardBtn(
        "fas fa-arrow-up",
        "10px",
        "10px",
        `buttonUp${index + offset}`,
        () => console.log("up button clicked")
      );
      let buttonDown = createCardBtn(
        "fas fa-arrow-down",
        "10px",
        "50px",
        `buttonDown${index + offset}`,
        () => console.log("down button clicked")
      );
      let buttonComment = createCardBtn(
        "fas fa-comment",
        "10px",
        "90px",
        `buttonComment${index + offset}`,
        () => console.log("comment button clicked")
      );
      let buttonSave = createCardBtn(
        "fas fa-bookmark",
        "10px",
        "130px",
        `buttonSave${index + offset}`,
        () => console.log("save button clicked")
      );
      let buttonShare = createCardBtn(
        "fas fa-share",
        "10px",
        "170px",
        `buttonShare${index + offset}`,
        () => console.log("share button clicked")
      );

      buttonsContainer.appendChild(buttonUp);
      buttonsContainer.appendChild(buttonDown);
      buttonsContainer.appendChild(buttonComment);
      buttonsContainer.appendChild(buttonSave);
      buttonsContainer.appendChild(buttonShare);

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



let handleInfiniteScroll = () => {
  throttle(() => {
    let endOfPage =
      window.innerHeight + window.pageYOffset >=
      document.body.offsetHeight - 30;

    if (endOfPage) {
      loadPosts(false);
    }
  }, 100);
};

let removeInfiniteScroll = () => {
  loader.remove();
  window.removeEventListener("scroll", handleInfiniteScroll);
};

window.onload = function () {
  loadPosts(false);
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
      document.getElementById("removeButton").style.display = "inline-block";
    } else {
      alert("Please upload a valid PDF file.");
    }
  }
}





async function uploadPost() {
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

  const userUUID = "49b6e479-fab2-4e6e-a2ed-3f7c5950ab9d";
  const createdAt = new Date().toISOString();

  const formData = new FormData();
  formData.append("title", title);
  formData.append("pdf", selectedFile);
  formData.append("created_at", createdAt);
  formData.append("user_uuid", userUUID);

  try {
    const response = await fetch("/postss", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      titleInput.value = "";
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

          const newParagraph = document.createElement('p');
          const textBeforeBr = document.createTextNode('Drag and Drop or Click here');
          const newBr = document.createElement('br');
          const textAfterBr = document.createTextNode('to upload PDF');

          newParagraph.appendChild(textBeforeBr);
          newParagraph.appendChild(newBr);
          newParagraph.appendChild(textAfterBr);
          pdfView.appendChild(newParagraph);

          const newSpan = document.createElement('span');
          newSpan.className = 'bottom-text';
          newSpan.textContent = 'Upload any PDF from desktop';

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

  const newParagraph = document.createElement('p');
  const textBeforeBr = document.createTextNode('Drag and Drop or Click here');
  const newBr = document.createElement('br');
  const textAfterBr = document.createTextNode('to upload PDF');

  newParagraph.appendChild(textBeforeBr);
  newParagraph.appendChild(newBr);
  newParagraph.appendChild(textAfterBr);
  pdfView.appendChild(newParagraph);

  const newSpan = document.createElement('span');
  newSpan.className = 'bottom-text';
  newSpan.textContent = 'Upload any PDF from desktop';

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
