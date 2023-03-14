const manual_and_forms = document.querySelector("#manual_and_forms");
const intership_manual_forms = document.querySelector("#intership_manual_forms");
const form_and_annuals = document.querySelector("#form_and_annuals");

const jsonfile = '../pdf_links/pdf.json'; 
async function getPdf()  {
  const response = await fetch(jsonfile);
  const pdfs = await response.json();


  pdfs.forEach(pdf => {

    if(pdf.header == "MANUAL AND FORMS") {

      pdf.links.forEach(list => {

        CreateElement(list.filename, list.link, manual_and_forms);
      })
    }

    if(pdf.header == "SIP INTERNSHIPS MANUAL FORMS") {
      pdf.links.forEach(list => {
        
        CreateElement(list.filename, list.link, intership_manual_forms);
      })
    }

    if(pdf.header == "SIP FORM & ANNUALS") {
      pdf.links.forEach(list => {

        CreateElement(list.filename, list.link, form_and_annuals);
      })
    }
  });
}

function CreateElement(filename, links, container) {
  // const li = document.createElement("li");
  const a = document.createElement("a");

  a.innerText = filename;

  a.href = links;

  a.setAttribute("target", "_blank");
  a.className = "text-decoration-none mb-2";

  // container.append(li);
  // li.append(a);
  container.append(a);
}

getPdf()