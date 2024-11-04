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

let createCard = (cardNumber) => {
  let card = document.createElement("div");
  card.className = "card";

  let buttonUp = createCardBtn(
    "fas fa-arrow-up",
    "10px",
    "10px",
    `buttonUp${cardNumber}`,
    () => console.log("up button clicked")
  );
  let buttonDown = createCardBtn(
    "fas fa-arrow-down",
    "10px",
    "50px",
    `buttonDown${cardNumber}`,
    () => console.log("down button clicked")
  );
  let buttonComment = createCardBtn(
    "fas fa-comment",
    "10px",
    "90px",
    `buttonComment${cardNumber}`,
    () => console.log("comment button clicked")
  );
  let buttonSave = createCardBtn(
    "fas fa-bookmark",
    "10px",
    "130px",
    `buttonSave${cardNumber}`,
    () => console.log("save button clicked")
  );
  let buttonShare = createCardBtn(
    "fas fa-share",
    "10px",
    "170px",
    `buttonShare${cardNumber}`,
    () => console.log("share button clicked")
  );

  card.appendChild(buttonUp);
  card.appendChild(buttonDown);
  card.appendChild(buttonComment);
  card.appendChild(buttonSave);
  card.appendChild(buttonShare);

  cardContainer.appendChild(card);
};

let handleInfiniteScroll = () => {
  throttle(() => {
    let endOfPage =
      window.innerHeight + window.pageYOffset >= document.body.offsetHeight;

    if (endOfPage) {
      cardNum += 1;
      console.log(cardNum);
      createCard(cardNum);
    }
  }, 10);
};

let removeInfiniteScroll = () => {
  loader.remove();
  window.removeEventListener("scroll", handleInfiniteScroll);
};

window.onload = function () {
  createCard();
};

window.addEventListener("scroll", handleInfiniteScroll);

function changeToPostScreen() {
  fetch("createPost.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("main").innerHTML = data;
    })
    .catch((error) => console.error("Error loading create.html:", error));
}
document
  .getElementById("createButton")
  .addEventListener("click", changeToPostScreen);
