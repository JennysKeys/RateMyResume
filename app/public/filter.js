let filterForm = document.getElementById("form");
let sliderOne = document.getElementById("slider-1");
let sliderTwo = document.getElementById("slider-2");
let displayValOne = document.getElementById("range1");
let displayValTwo = document.getElementById("range2");
let minGap = 0;
let sliderTrack = document.querySelector(".slider-track");
let sliderMaxValue = document.getElementById("slider-1").max;

filterForm.addEventListener("submit", filter);

function filter(event) {
  let inputs = form.getElementsByTagName("input");
  let checked = [];
  let schools = [];
  let majors = [];
  let gpaMin = sliderOne.value;
  let gpaMax = sliderTwo.value;

    for(let i of inputs) {
        if(i.type == "checkbox") {
            if (i.checked) {
            checked.push(i);
            if(i.id == "school") {
                schools.push(i.value);
            } else if(i.id == "gpa") {
                gpas.push(i.value);
            } else if(i.id == "major") {
                majors.push(i.value);
            }
        }
        }
        
    }
    console.log(gpaMin, gpaMax);
    let filters = {schools, majors, gpaMin, gpaMax};
    offset = 0;
    loadPosts(true, filters);
}
  
  function slideOne() {
    if (parseFloat(sliderTwo.value) - parseFloat(sliderOne.value) <= minGap) {
      sliderOne.value = parseFloat(sliderTwo.value) - minGap;
    }
    displayValOne.textContent = sliderOne.value;
    fillColor();
  }
  function slideTwo() {
    if (parseFloat(sliderTwo.value) - parseFloat(sliderOne.value) <= minGap) {
      sliderTwo.value = parseFloat(sliderOne.value) + minGap;
    }
    displayValTwo.textContent = sliderTwo.value;
    fillColor();
  }
  function fillColor() {
    percent1 = (sliderOne.value / sliderMaxValue) * 100;
    percent2 = (sliderTwo.value / sliderMaxValue) * 100;
    sliderTrack.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , #3264fe ${percent1}% , #3264fe ${percent2}%, #dadae5 ${percent2}%)`;
  }
  