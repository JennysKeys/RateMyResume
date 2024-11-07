const dropArea = document.getElementById("dropArea");
const inputPDF = document.getElementById("inputPDF");

// Handle file selection
inputPDF.addEventListener("change", handleFiles);

function handleFiles(event) {
  console.log("hi");
  const files = event.target.files;
  if (files.length > 0) {
    const file = files[0];
    console.log(file);
    if (file.type === "application/pdf") {
      message.textContent = `Uploaded: ${file.name}`;
      const fileURL = URL.createObjectURL(file);
      console.log(fileURL);
    } else {
      message.textContent = "Please upload a valid PDF file.";
    }
  }
}
