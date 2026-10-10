const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (index.html) directly from the current directory
app.use(express.static(__dirname));

const PORT = 3000;
const PYTHON_URL = 'http://127.0.0.1:5001';

// Route 1: Simple test endpoint
app.get('/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js Gateway!' });
});

// Route 2: Main integration endpoint (FIXED)
app.post('/api/calculate', async (req, res) => {
    console.log('Node.js received:', req.body);
    try {
        // Fixed string template and axios arguments:
        const pythonResponse = await axios.post(`${PYTHON_URL}/calculate`, req.body);
        res.json({
            gateway_message: 'Node.js successfully aggregated the data!',
            python_result: pythonResponse.data
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to reach Python service. Is it running on port 5001?'
        });
    }
});

// Route 3: System status check
app.get('/api/status', async (req, res) => {
    try {
        const ping = await axios.get(`${PYTHON_URL}/ping`);
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

app.listen(PORT, () => {
    console.log(`Node.js Gateway: http://localhost:${PORT}`);
    console.log(`Python URL: ${PYTHON_URL}`);
});