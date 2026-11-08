
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = 3000;
const PYTHON_URL = 'http://127.0.0.1:5001';

const HISTORY_FILE = path.join(__dirname, 'history.csv');

const CSV_HEADER =
    'Date,Number 1,Operation,Number 2,Result,Status,Message\n';

// Escape CSV values
function escapeCSV(value) {
    let text = String(value ?? '');

    // Prevent spreadsheet formula injection in text fields
    if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
}

// Save calculation history
async function logHistory(
    num1,
    operation,
    num2,
    result,
    status,
    message
) {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            await fs.promises.writeFile(
                HISTORY_FILE,
                CSV_HEADER,
                'utf8'
            );
        }

        const row = [
            new Date().toLocaleString('en-PH'),
            num1,
            operation,
            num2,
            result,
            status,
            message
        ].map(escapeCSV).join(',') + '\n';

        await fs.promises.appendFile(
            HISTORY_FILE,
            row,
            'utf8'
        );

        console.log('Calculation saved to history.csv');

    } catch (error) {
        console.error('CSV Logging Error:', error.message);
    }
}

// Route 1: Test endpoint
app.get('/hello', (req, res) => {
    res.json({
        message: 'Hello from Node.js Gateway!'
    });
});

// Route 2: Main calculation endpoint
app.post('/api/calculate', async (req, res) => {

    console.log('Node.js received:', req.body);

    const { num1, num2, operation } = req.body;

    if (
        typeof num1 !== 'number' ||
        !Number.isFinite(num1) ||
        typeof num2 !== 'number' ||
        !Number.isFinite(num2) ||
        typeof operation !== 'string'
    ) {
        await logHistory(
            num1,
            operation,
            num2,
            '',
            'ERROR',
            'Invalid input'
        );

        return res.status(400).json({
            error: 'Please provide valid numbers and an operation.'
        });
    }

    try {
        // Send request to Python
        const pythonResponse = await axios.post(
            `${PYTHON_URL}/calculate`,
            { num1, num2, operation }
        );

        const pythonResult = pythonResponse.data;

        // Save successful calculation
        await logHistory(
            num1,
            operation,
            num2,
            pythonResult.result,
            'SUCCESS',
            pythonResult.message
        );

        // Return result to HTML
        res.json({
            gateway_message: 'Node.js successfully aggregated the data!',
            python_result: pythonResult
        });

    } catch (error) {

        const pythonError = error.response?.data?.message ||
            error.message;

        const statusCode = error.response?.status || 500;

        // Save failed calculation
        await logHistory(
            num1,
            operation,
            num2,
            '',
            'ERROR',
            pythonError
        );

        console.error('Gateway Error:', pythonError);

        res.status(statusCode).json({
            error: pythonError,
            gateway_message: 'Python calculation failed.'
        });
    }
});

// Route 3: System status
app.get('/api/status', async (req, res) => {

    try {
        const ping = await axios.get(
            `${PYTHON_URL}/ping`
        );

        res.json({
            gateway: 'Node.js is running',
            python: ping.data
        });

    } catch (error) {

        res.status(500).json({
            gateway: 'Node.js is running',
            python: 'Python is NOT reachable'
        });
    }
});

// Start Node.js server
app.listen(PORT, () => {
    console.log('================================');
    console.log('Node.js Gateway is running!');
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`Python URL: ${PYTHON_URL}`);
    console.log(`History: ${HISTORY_FILE}`);
    console.log('================================');
});
