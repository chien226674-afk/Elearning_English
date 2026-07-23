import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load .env from the root of the project
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet()); // Set security HTTP headers

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter); // Apply rate limiter to /api routes
app.use('/auth', limiter); // Apply rate limiter to /auth routes

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Elearning API is running...');
});

// 404 Logger Handler
app.use((req, res, next) => {
    console.log(`[404 NOT FOUND] ${req.method} ${req.url}`);
    res.status(404).json({ message: `Route ${req.url} not found` });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
