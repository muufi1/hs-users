import { createPool } from 'mariadb';
import dotenv from "dotenv";
dotenv.config();

export default createPool({
    socketPath: process.env.SOCKETPATH,
    user: process.env.USER,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    connectionLimit: 5
});


