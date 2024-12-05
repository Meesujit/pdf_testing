import { PDFDocument } from 'pdf-lib';

// Define the mapping between field names and JSON keys
const fieldMapping = {
    "Applicant's Name and Address": "applicantNameAndAddress",
    "Policy Number": "policyNumber",
    "Effective Date": "effectiveDate",
    "Expiration Date": "expirationDate",
    "DOB": "dateOfBirth",
    "SSN": "socialSecurityNumber",
    "Phone": "phoneNumber"
};

async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();

    const fields = form.getFields();
    const formData = {};

    fields.forEach((field) => {
        const fieldName = field.getName();
        const fieldValue = field.getText() || field.getSelected();
        const jsonKey = fieldMapping[fieldName] || fieldName;
        formData[jsonKey] = fieldValue || null;
    });

    console.log('Extracted JSON Data:', formData);
    document.getElementById('output').textContent = JSON.stringify(formData, null, 2);
}

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('pdf-upload');
    fileInput.addEventListener('change', handlePdfUpload);
});