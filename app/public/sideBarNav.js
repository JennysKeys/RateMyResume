let cardNum = 0;

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

async function loadPosts() {
  try {
    const response = await fetch(
      `http://localhost:3000/posts?limit=${limit}&offset=${offset}`
    );
    const posts = await response.json();
    offset += limit;

    posts.forEach((post, index) => {
      const card = document.createElement("div");
      card.className = "card";
      //Header div for username and date
      const headerContainer = document.createElement("div");
      headerContainer.className = "card-header";
      const usernameElement = document.createElement("h3");
      usernameElement.textContent = post.username;
      const dateElement = document.createElement("p");
      dateElement.textContent = post.created_at;

      headerContainer.appendChild(usernameElement);
      headerContainer.appendChild(dateElement);

      //Div container for the title of the post
      const titleContainer = document.createElement("div");
      titleContainer.className = "card-title";
      const titleElement = document.createElement("h2");
      titleElement.textContent = post.title;
      titleContainer.appendChild(titleElement);

      card.appendChild(headerContainer);
      card.appendChild(document.createElement("hr"));
      card.appendChild(titleContainer);

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

      card.appendChild(buttonUp);
      card.appendChild(buttonDown);
      card.appendChild(buttonComment);
      card.appendChild(buttonSave);
      card.appendChild(buttonShare);

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
      window.innerHeight + window.pageYOffset >= document.body.offsetHeight;

    if (endOfPage) {
      loadPosts();
    }
  }, 100);
};

let removeInfiniteScroll = () => {
  loader.remove();
  window.removeEventListener("scroll", handleInfiniteScroll);
};

window.onload = function () {
  loadPosts();
};

window.addEventListener("scroll", handleInfiniteScroll);

document.getElementById("createButton").addEventListener("click", function () {
  console.log("hihih")
  const mainContainer = document.getElementById("main");

  fetch("createPost.html")
    .then((response) => response.text())
    .then((html) => {
      console.log("hi")
      mainContainer.innerHTML = html;
      const inputPDF = document.getElementById("inputPDF");

      inputPDF.addEventListener("change", handleFiles);
    });
});

const pdfDisplay = document.getElementById("pdfDisplay");

function handleFiles(event) {
  const files = event.target.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type === "application/pdf") {
      const fileURL = URL.createObjectURL(file);
      
      // Create an iframe to display the PDF
      const pdfDisplay = document.createElement("iframe");
      pdfDisplay.src = fileURL;


      // Get the drop file input container
      const dropFileInputContainer = document.getElementById("dropArea");

      // Remove existing children without using innerHTML
      while (dropFileInputContainer.firstChild) {
        dropFileInputContainer.removeChild(dropFileInputContainer.firstChild);
      }

      // Append the new PDF display
      dropFileInputContainer.appendChild(pdfDisplay);
    } else {
      alert("Please upload a valid PDF file.");
    }
  }
}





