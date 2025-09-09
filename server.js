const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { authenticateToken } = require('./auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/generate-permit', authenticateToken, (req, res) => {
    const { name, idNumber, issueDate, expiryDate } = req.body;

    if (!name || !idNumber || !issueDate || !expiryDate) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const doc = new PDFDocument();
    let filename = `permit_${name.replace(' ', '_')}.pdf`;
    let filePath = path.join(__dirname, 'permits', filename);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(25).text('Department of Home Affairs', { align: 'center' });
    doc.moveDown();

    doc.fontSize(20).text('Permit', { align: 'center' });
    doc.moveDown();

    doc.fontSize(15).text(`Name: ${name}`);
    doc.text(`ID Number: ${idNumber}`);
    doc.text(`Issue Date: ${issueDate}`);
    doc.text(`Expiry Date: ${expiryDate}`);

    // Add watermark
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('white', 0.5).opacity(0.5).text('Official Document', 100, 100, { align: 'center', width: doc.page.width - 200, opacity: 0.5 });

    // Add anti-fraud measures (e.g., unique identifier)
    const uniqueId = Math.random().toString(36).substr(2, 9);
    doc.text(`Unique ID: ${uniqueId}`, 10, doc.page.height - 20);

    doc.end();

    res.download(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error generating permit' });
        }
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                return res.status(500).json({ error: 'Error deleting temporary file' });
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
