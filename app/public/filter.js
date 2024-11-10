let form = document.getElementById("form");

form.addEventListener("submit", filter);

function filter(event) {
  let inputs = form.getElementsByTagName("input");
  let checked = [];
  let schools = [];
  let gpas = [];
  let majors = [];

    for(let i of inputs) {
        if(i.type == "checkbox") {
            if (i.checked) {
            checked.push(i);
            if(i.name == "school") {
                schools.push(i);
            } else if(i.name == "gpa") {
                gpas.push(i);
            } else if(i.name == "major") {
                majors.push(i);
            }
            console.log(i.id + ": " + i.value);
        }
        }
        
    }

    
}
