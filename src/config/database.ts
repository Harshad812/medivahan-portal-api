import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use the database name that you created
const DATABASE_NAME = process.env.REACT_APP_DB_NAME as string;
const USERNAME = process.env.REACT_APP_USERNAME as string;
const PASSWORD = process.env.REACT_APP_PASSWORD as string;
const HOST = process.env.REACT_APP_HOST as string;

const sequelize = new Sequelize(DATABASE_NAME, USERNAME, PASSWORD, {
  host: HOST,
  dialect: 'mysql',
  logging: true,
});

export default sequelize;
