import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const DATABASE_NAME = process.env.DB_NAME || '';
const USERNAME = process.env.USERNAME || '';
const PASSWORD = process.env.PASSWORD || '';
const HOST = process.env.HOST || '';

// Create a Sequelize instance for checking and creating the database
const sequelize = new Sequelize(`mysql://${USERNAME}:${PASSWORD}@${HOST}`, {
  dialect: 'mysql',
  logging: false,
});

export const createDatabaseIfNotExists = async () => {
  try {
    // Connect to MySQL server without specifying a database
    await sequelize.authenticate();

    // Check if the database exists
    const [result] = await sequelize.query(
      `SHOW DATABASES LIKE '${DATABASE_NAME}'`
    );
    if (result.length === 0) {
      // Create the database if it does not exist
      await sequelize.query(`CREATE DATABASE ${DATABASE_NAME}`);
      console.log(`Database ${DATABASE_NAME} created successfully.`);
    } else {
      console.log(`Database ${DATABASE_NAME} already exists.`);
    }
  } catch (error) {
    console.error('Unable to create database:', error);
    throw error; // Propagate the error to handle it in the server startup
  } finally {
    await sequelize.close();
  }
};
