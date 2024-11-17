let filterForm = document.getElementById("form");

filterForm.addEventListener("submit", filter);

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
    let filters = {schools, gpas, majors};
    offset = 0;
    loadPosts(true, filters);
}
