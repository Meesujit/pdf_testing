import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";



const PdfWithTags = () => {
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState({});
  const [pdfFile, setPdfFile] = useState(null);
  const [filledPdfUrl, setFilledPdfUrl] = useState(null);

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      const pdfData = new Uint8Array(fileReader.result);

      // Use pdf.js to load the document
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const extractedTags = [];

      // Iterate through each page to extract text
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        textContent.items.forEach((item) => {
          const matches = item.str.match(/\{\{.*?\}\}/g); // Find {{...}} patterns
          if (matches) {
            extractedTags.push(...matches);
          }
        });
      }

      // Generate form fields from tags
      const formFields = generateFormFields(extractedTags);
      setTags(formFields);

      // Initialize form data
      const initialFormData = {};
      formFields.forEach((field) => {
        initialFormData[field.id] = "";
      });
      setFormData(initialFormData);
    };

    fileReader.readAsArrayBuffer(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFormSubmit = async () => {
    if (!pdfFile) {
      alert("Please upload a PDF file!");
      return;
    }

    const pdfBytes = await pdfFile.arrayBuffer();
    const filledPdfBytes = await fillPdfWithTags(pdfBytes, formData);

    const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setFilledPdfUrl(url);
  };

  const generateFormFields = (tags) =>
    tags.map((tag) => ({
      id: tag,
      label: tag.replace(/[\{\}]/g, ""), // Clean label
      value: "",
    }));

  const fillPdfWithTags = async (pdfBytes, formData) => {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    Object.keys(formData).forEach((tag) => {
      const field = form.getField(tag);
      if (field) {
        field.setText(formData[tag]);
      } else {
        console.warn(`Field "${tag}" not found.`);
      }
    });

    form.flatten(); // Optional: Make fields non-editable
    return await pdfDoc.save();
  };

  return (
    <div>
      <h1>Dynamic PDF Filler</h1>
      <input type="file" accept="application/pdf" onChange={handlePdfUpload} />
      {tags.length > 0 && (
        <form onSubmit={(e) => e.preventDefault()}>
          {tags.map((tag, index) => (
            <div key={index}>
              <label>{tag.label}</label>
              <input
                type="text"
                name={tag.id}
                value={formData[tag.id]}
                onChange={handleInputChange}
              />
            </div>
          ))}
          <button onClick={handleFormSubmit}>Submit & Generate PDF</button>
        </form>
      )}
      {filledPdfUrl && (
        <a href={filledPdfUrl} download="filled_form.pdf">
          Download Filled PDF
        </a>
      )}
    </div>
  );
};

export default PdfWithTags;
