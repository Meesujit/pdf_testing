import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";

const PdfFormHandler = () => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [pdfDoc, setPdfDoc] = useState(null);
  const [filledPdfUrl, setFilledPdfUrl] = useState(null);

  // Handle PDF Upload
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);

    setPdfDoc(pdf);

    const form = pdf.getForm();
    const formFields = form.getFields();
    const fieldNames = formFields.map((field) => field.getName());

    // Limit fields to only 2-3 for testing
    const limitedFields = fieldNames.slice(0, 3);

    // Initialize form data state for limited fields
    const initialData = {};
    limitedFields.forEach((field) => (initialData[field] = ""));
    setFields(limitedFields);
    setFormData(initialData);
  };

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fill and Download PDF
  const handleFillAndDownload = async () => {
    if (!pdfDoc) {
      alert("Upload a PDF first!");
      return;
    }

    const form = pdfDoc.getForm();
    fields.forEach((field) => {
      const formField = form.getField(field);
      if (formField && formField.setText) {
        formField.setText(formData[field] || ""); // Fill text
      } else {
        console.warn(`Field "${field}" cannot be filled or is not text.`);
      }
    });

    const filledPdfBytes = await pdfDoc.save();
    const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setFilledPdfUrl(url);
  };

  return (
    <div style={styles.container}>
      <h1>PDF Form Handler</h1>
      <input type="file" accept="application/pdf" onChange={handlePdfUpload} />
      {fields.length > 0 && (
        <div style={styles.form}>
          {fields.map((field, index) => (
            <div key={index} style={styles.formGroup}>
              <label>{field}</label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
              />
            </div>
          ))}
          <button onClick={handleFillAndDownload}>Fill & Download PDF</button>
        </div>
      )}
      {filledPdfUrl && (
        <a href={filledPdfUrl} download="filled_form.pdf">
          Download Filled PDF
        </a>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    textAlign: "center",
  },
  form: {
    marginTop: "20px",
  },
  formGroup: {
    marginBottom: "15px",
  },
};

export default PdfFormHandler;
