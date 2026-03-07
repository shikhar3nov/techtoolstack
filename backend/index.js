const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const parsedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const allowedOrigins = parsedOrigins.length
  ? parsedOrigins
  : [
      'https://techtoolstack.com',
      'https://www.techtoolstack.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

// Enable CORS for all routes
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // if you're using cookies/auth headers
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const toolsRoutes = require('./routes/tools.routes');
console.log('toolsRoutes:', toolsRoutes); // Should show [Function: router]
app.use('/api', toolsRoutes);

// app.get('/api/tools/health', (req, res) => {
//   res.json({ status: 'Health check working!' });
// });

// Error handling middleware
app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      matches: [],
      error: 'Request too large. Please use smaller text.',
      explanation: 'Text too large for processing'
    });
  }
  
  res.status(500).json({
    matches: [],
    error: 'Internal server error',
    explanation: 'Server error occurred'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    version: '1.0.0',
    endpoints: '/api'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
});
