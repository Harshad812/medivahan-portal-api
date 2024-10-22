import express from 'express';
import sequelize from './config/database';
import userRoutes from './routes/userRoutes';
import clinicRoutes from './routes/clinicRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import adminRoutes from './routes/adminRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import deliveryBoyRoutes from './routes/deliveryBoyRoutes';
import passport from './middleware/passport';
import dotenv from 'dotenv';
import cors from 'cors';
// import { createDatabaseIfNotExists } from './scripts/initDatabase';

// Load environment variables from .env file
dotenv.config();

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

const PORT = process.env.PORT || 8000;

app.use(express.json());

// Initialize Passport.js
app.use(passport.initialize());

const startServer = async () => {
  try {
    // Initialize the database
    // await createDatabaseIfNotExists();
    await sequelize.sync({ alter: true, force: false });
    console.log('Database connected.');

    // Set up routes
    app.use('/api', userRoutes);
    app.use('/api', clinicRoutes);
    app.use('/api', prescriptionRoutes);
    app.use('/api', adminRoutes);
    app.use('/api', dashboardRoutes);
    app.use('/api', deliveryBoyRoutes);
    app.use('/', (req, res) => {
      res.send('Api started..!');
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
