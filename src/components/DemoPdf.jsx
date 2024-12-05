import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const DemoPdf = () => {
    const [jsonData, setJsonData] = useState(null); // Store extracted data
    const [latLonData, setLatLonData] = useState(null); // Store transformed lat/lon data

    const handlePdfUpload = async (event) => {
        const file = event.target.files[0]; // Get the uploaded PDF file
        if (!file) return;

        // Read the file as an ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer); // Load the PDF with pdf-lib
        const pages = pdfDoc.getPages(); // Get all pages
        const pageHeight = pages[0].getHeight(); // Get the height of the first page

        const form = pdfDoc.getForm(); // Extract the form fields
        const fieldCoordinates = [];

        form.getFields().forEach((field) => {
            const fieldName = field.getName(); // Field name (like input name)
            const widgets = field.acroField.getWidgets(); // Field's widget (its visual position)

            widgets.forEach((widget) => {
                const rect = widget.getRectangle(); // Get the coordinates (x, y, width, height)
                fieldCoordinates.push({
                    name: fieldName,
                    coordinates: {
                        left: rect.x, // Left position (x-coordinate)
                        width: rect.width, // Width of the field
                        height: rect.height, // Height of the field
                        pageHeight, // Total height of the page
                        top: pageHeight - rect.y - rect.height, // Calculate top position (PDF uses bottom-left origin)
                    },
                });
            });
        });

        // Set the extracted coordinates in the state
        setJsonData(fieldCoordinates);

        // Assuming you have a map with geographic bounds, let's convert the coordinates:
        const latLon = convertCoordinatesToLatLon(fieldCoordinates, 600, 800, 40.7128, -74.0060, 34.0522, -118.2437);
        setLatLonData(latLon);
    };

    // Convert PDF coordinates to Latitude/Longitude
    const convertCoordinatesToLatLon = (fields, pdfWidth, pdfHeight, latTop, lonLeft, latBottom, lonRight) => {
        return fields.map((field) => {
            const { left, top, width, height } = field.coordinates;

            const scaleX = (lonRight - lonLeft) / pdfWidth;
            const scaleY = (latTop - latBottom) / pdfHeight;

            const lon = lonLeft + left * scaleX;
            const lat = latTop - top * scaleY;

            return {
                name: field.name,
                coordinates: {
                    latitude: lat,
                    longitude: lon,
                },
            };
        });
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'row' }}>
          <div>
            <h1>PDF Field Coordinate Extractor</h1>
            <input type="file" accept=".pdf" onChange={handlePdfUpload} />
            <h2>Extracted PDF Coordinates:</h2>
            <pre style={{ background: '#f4f4f4', padding: '10px' }}>
                {jsonData ? JSON.stringify(jsonData, null, 2) : 'Upload a PDF to see data'}
            </pre>
          </div>
          <div>
            <h2>Converted Latitude/Longitude:</h2>
            <pre style={{ background: '#f4f4f4', padding: '10px' }}>
                {latLonData ? JSON.stringify(latLonData, null, 2) : 'Converted coordinates will appear here'}
            </pre>
          </div>
        </div>
    );
}

export default DemoPdf;
