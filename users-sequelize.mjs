import { Sequelize, DataTypes, Model } from "sequelize";
import { default as jsyaml } from 'js-yaml';
import { promises as fs } from "fs";
import * as util from 'util';
import DBG from 'debug';
const log = DBG('users:model-users');
const error = DBG('users:error');
import dotenv from 'dotenv';
dotenv.config();

let sequlz;

export class SQUser extends Model {}

export async function connectDB() {
    if (sequlz) return sequlz;
    
    const yamltext = await fs.readFile(process.env.SEQUELIZE_CONNECT, 'utf-8');
    const params = await jsyaml.load(yamltext, 'utf8');
    if (typeof process.env.SEQUELIZE_DBNAME !== 'undefined' 
        && process.env.SEQUELIZE_DBNAME !== '') {
            params.dbname = process.env.SEQUELIZE_DBNAME;
        }
    if (typeof process.env.SEQUELIZE_DBUSER !== 'undefined' 
        && process.env.SEQUELIZE_DBUSER !== '') {
            params.username = process.env.SEQUELIZE_DBUSER;
        }
    if (typeof process.env.SEQUELIZE_DBPASSWD !== 'undefined' 
        && process.env.SEQUELIZE_DBPASSWD !== '') {
            params.password = process.env.SEQUELIZE_DBPASSWD;
        }
    if (typeof process.env.SEQUELIZE_DBHOST !== 'undefined' 
        && process.env.SEQUELIZE_DBHOST !== '') {
            params.params.host = process.env.SEQUELIZE_DBHOST;
        }
    if (typeof process.env.SEQUELIZE_DBPORT !== 'undefined' 
        && process.env.SEQUELIZE_DBPORT !== '') {
            params.params.port = process.env.SEQUELIZE_DBPORT;
        }
    if (typeof process.env.SEQUELIZE_DBDIALECT !== 'undefined' 
        && process.env.SEQUELIZE_DBDIALECT !== '') {
            params.params.dialect = process.env.SEQUELIZE_DBDIALECT;
        }
    if (typeof process.env.SEQUELIZE_DBSOCKETPATH !== 'undefined' 
        && process.env.SEQUELIZE_DBSOCKETPATH !== '') {
            params.params.socketPath = process.env.SEQUELIZE_DBSOCKETPATH;
        }
    log('Sequelize params ' + util.inspect(params));
    sequlz = new Sequelize(params.dbname, params.username, 
        params.password, params.params);
    SQUser.init({
        email: { type: DataTypes.STRING, primaryKey: true},
        password: DataTypes.STRING,
        valid: { type: DataTypes.BOOLEAN }
    }, {
        sequelize: sequlz,
        modelName: 'users'
    });
    await SQUser.sync();
}

export function userParams(req) {
    return {
        email: req.params.email
    };
}

export function sanitizedUser(user) {
    let ret = {
        email: user.email
    };
    return ret;
}

export async function findOneUser(email) {
    let user = await SQUser.findOne({ attributes: ['email', 'password', 'valid'], where: { email: email } });
    user = user ? sanitizedUser(user) : undefined;
    return user;
}

export async function createUser(req) {
    let tocreate = userParams(req);
    await SQUser.create(tocreate);
    const result = await findOneUser(req.params.email);
    return result;
}

export async function updatePassword(email, passwd) {
    await SQUser.update(
        { 
            password: passwd,
            valid: true,
        },
        {
            where: {
                email: email,
            },
        },
    );
    return await findOneUser(email);
}
