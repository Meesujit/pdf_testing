import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";

const Pdf = () => {
    const [fields, setFields] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [pdfFile, setPdfFile] = useState(null);
    const [filledPdfUrl, setFilledPdfUrl] = useState(null);

    // Handle PDF Upload
    const handlePdfUpload = async (event) => {
        const file = event.target.files[0];
        setPdfFile(file);
        const pdfBytes = await file.arrayBuffer();

        // Load PDF and extract field names
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields().map((field) => field.getName());
        setFields(fields);

        // Automatically select the first 4–5 fields for simplicity
        const initialSelectedFields = fields.slice(0, 5); // Adjust the number as needed
        setSelectedFields(initialSelectedFields);

        // Initialize form data for the selected fields
        const initialData = {};
        initialSelectedFields.forEach((field) => {
            initialData[field] = "";
        });
        setFormData(initialData);
    };

    // Handle Form Input Changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };
    const fillPdf = async () => {
        if (!pdfFile) {
            alert("Please upload a PDF file!");
            return;
        }

        const pdfBytes = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        // Log all field names in the PDF
        const fields = form.getFields();
        fields.forEach((field) => {
            console.log(`Field Name: ${field.getName()}, Field Type: ${field.constructor.name}`);
        });

        // Fill fields using formData
        Object.keys(formData).forEach((key) => {
            const field = form.getField(key);
            if (field) {
                if (field.constructor.name === "PDFTextField") {
                    field.setText(formData[key]);
                } else if (field.constructor.name === "PDFCheckBox") {
                    const isChecked = formData[key]?.toLowerCase() === "true";
                    isChecked ? field.check() : field.uncheck();
                } else if (field.constructor.name === "PDFDropdown") {
                    field.select(formData[key]);
                } else if (field.constructor.name === "PDFRadioGroup") {
                    field.select(formData[key]);
                } else {
                    console.warn(`Field type ${field.constructor.name} is not handled.`);
                }
            } else {
                console.warn(`Field "${key}" not found in the PDF.`);
            }
        });

        form.flatten(); // Flatten the form after filling
        const filledPdfBytes = await pdfDoc.save();
        const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setFilledPdfUrl(url);
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Dynamic PDF Form Filler</h1>
            <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                style={styles.uploadInput}
            />
            {selectedFields.length > 0 && (
                <form style={styles.formContainer} onSubmit={(e) => e.preventDefault()}>
                    {selectedFields.map((field, index) => (
                        <div key={index} style={styles.formGroup}>
                            <label style={styles.label}>{field}</label>
                            <input
                                type="text"
                                name={field}
                                value={formData[field]}
                                onChange={handleInputChange}
                                style={styles.input}
                            />
                        </div>
                    ))}
                    <button onClick={fillPdf} style={styles.button}>
                        Submit & Generate PDF
                    </button>
                </form>
            )}
            {filledPdfUrl && (
                <a href={filledPdfUrl} download="filled_form.pdf" style={styles.downloadLink}>
                    Download Filled PDF
                </a>
            )}
        </div>
    );
};

// CSS-in-JS styles
const styles = {
    container: {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "'Arial', sans-serif",
        backgroundColor: "#f9f9f9",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    },
    heading: {
        textAlign: "center",
        marginBottom: "20px",
        fontSize: "24px",
        color: "#333",
    },
    uploadInput: {
        display: "block",
        margin: "0 auto 20px",
        padding: "10px",
        fontSize: "16px",
    },
    formContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        marginBottom: "20px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
    },
    label: {
        marginBottom: "5px",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#555",
    },
    input: {
        padding: "10px",
        fontSize: "14px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        outline: "none",
    },
    button: {
        padding: "10px 20px",
        fontSize: "16px",
        color: "#fff",
        backgroundColor: "#007BFF",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        transition: "background-color 0.3s",
        alignSelf: "center",
    },
    downloadLink: {
        display: "block",
        marginTop: "20px",
        textAlign: "center",
        fontSize: "16px",
        color: "#007BFF",
        textDecoration: "none",
    },
};

export default Pdf;
