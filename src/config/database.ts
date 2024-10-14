import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use the database name that you created
// const DATABASE_NAME = process.env.DB_NAME || '';
// const USERNAME = process.env.USERNAME || '';
// const PASSWORD = process.env.PASSWORD || '';
// const HOST = process.env.HOST || '';

// const DATABASE_NAME = 'medivahan_doctor_dev';
// const USERNAME = 'medivahandev';
// const PASSWORD = 'Medi@0532';
// const HOST = '13.127.149.87';

const DATABASE_NAME = 'medivahan_doctor_dev';
const USERNAME = 'root';
const PASSWORD = '123456';
const HOST = 'localhost';

const sequelize = new Sequelize(DATABASE_NAME, USERNAME, PASSWORD, {
  host: HOST,
  dialect: 'mysql',
  logging: true,
});

export default sequelize;
