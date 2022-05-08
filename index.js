const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 6001;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());