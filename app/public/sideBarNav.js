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

let createCard = () => {
  let card = document.createElement("div");

  card.className = "card";
  cardContainer.appendChild(card);
};

let handleInfiniteScroll = () => {
  throttle(() => {
    let endOfPage =
      window.innerHeight + window.pageYOffset >= document.body.offsetHeight;

    if (endOfPage) {
      createCard();
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
