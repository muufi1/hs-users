import { default as pool } from './dbconn.mjs';
import { default as DBG } from 'debug';
const debug = DBG('users:users-mariadb');
const error = DBG('users:error-mariadb');
import { generatePassword } from './pwd-gen.mjs';

export default class Credentials {

    async createPassword(email) {
        try {
            const db = await pool.getConnection();
            const password = generatePassword();
            console.log(password);
            db.close();
            return password;
        } catch (err) {
            console.error("Error in transaction: ", err);
        }
    }
    
    async deletePassword(email) {}
    
    async readPassword(email) {}
}

const cred = new Credentials();
cred.createPassword();
