const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../auth');
require('dotenv').config();

exports.handler = async (event, context) => {
    try {
        const authHeader = event.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        const { name, idNumber, issueDate, expiryDate } = JSON.parse(event.body);

        if (!name || !idNumber || !issueDate || !expiryDate) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'All fields are required' })
            };
        }

        const doc = new PDFDocument();
        let filename = `permit_${name.replace(' ', '_')}.pdf`;
        let filePath = path.join(__dirname, '..', 'permits', filename);

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

        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                resolve({
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=${filename}`
                    },
                    body: fs.readFileSync(filePath).toString('base64'),
                    isBase64Encoded: true
                });
            });
        });
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
