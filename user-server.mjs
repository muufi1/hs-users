import { default as express } from 'express';
import * as http from 'http';
import { default as bodyParser } from 'body-parser';
// import restify from 'restify';
import * as util from 'util';
import { SQUser, connectDB, userParams, findOneUser, updatePassword, createUser, sanitizedUser } from './users-sequelize.mjs';
import { generatePassword } from './pwd-gen.mjs';
import dotenv from 'dotenv';
dotenv.config();

import DBG from 'debug';
const log = DBG('users:service');
const error = DBG('users:error');


// set up the REST server

export const app = express();
export const port = process.env.PORT || '5858';
app.set('port', port);
export const server = http.createServer(app);
export const router = express.Router();
// let server = restify.createServer({
//     name: "User-Auth-Service",
//     version: "0.0.1"
// });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// server.use(restify.plugins.authorizationParser());
// server.use(check);
// server.use(restify.plugins.queryParser());
// server.use(restify.plugins.bodyParser({
//     mapParams: true
// }));

app.use('/', router);
server.listen(port);
// server.listen(process.env.port, "localhost", function() {
//     log(server.name + ' listening at ' + server.url);
// });

process.on('uncaughtException', function(err) {
    console.error("UNCAUGHT EXCEPTION – " + (err.stack || err));
    process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
    console.error(`unhandled promise rejection: ${util.inspect(p)} reason: ${reason}`);
    process.exit(1);
});

// mimic API Key authentication

let apiKeys = [
    { user: 'them', key: 'd4ed43c0-8bd6-4fe2-b358-7c0e230d11ef' }
];

function check(req, res, next) {
    var found = false
    for (let auth of apiKeys) {
        if (auth.key === req.authorization.basic.password 
            && auth.user === req.authorization.basic.username) {
                found = true;
                break;
        }
    }
    if (found) next();
    else {
        res.send(401, new Error("Not authenticated"));
        next(false);
    }
}

// server.post('/find', async (req, res, next) => {
//     try {
//         await connectDB();
//         let user = await findOneUser(req.params.email);
//         if (!user) throw new Error('User not found!');
//         res.contentType = 'json';
//         res.send(user);
//         return next(false);
//     } catch(err) {
//         res.send(500, err);
//         next(false);
//     }
// });

router.get('/', async (req, res) => {
    res.status(200).send('Hello from users service');
})

router.get('/find/:email', async (req, res, next) => {
    try {
        console.log(req.params.email);
        await connectDB();
        const user = await findOneUser(req.params.email);
        console.log(user);
        if (!user) {
            res.status(404).send(new Error("Did not find " + req.params.email));
        } else {
            res.contentType = 'json';
            res.send(user);
        }
    } catch(err) {
        res.status(500).send(err);
    }
});

router.post('/update-user/:email', async (req, res, next) => {
    try {
        await connectDB();
        let toupdate = userParams(req);
        // await SQUser.update(toupdate, { where: { email: req.params.email }});
        const result = await findOneUser(req.params.email);
        res.contentType = 'json';
        res.send(result);
    } catch(err) {
        res.status(500).send(err);
    }
});

router.post('/refresh-password', async (req, res, next) => {
    try {
        await connectDB();
        const newPassword = generatePassword();
        const result = await updatePassword(req.body.email, newPassword);
        res.contentType = 'json';
        res.send(result);
    } catch(err) {
        res.status(500).send(err);
    }
});

router.post('/revoke-password', async (req, res, next) => {
    try {
        await connectDB();
        let toupdate = {
            password: null,
            valid:0
        };
        await SQUser.update(toupdate, { where: { email: req.params.email }});
        const result = await findOneUser(req.params.email);
        res.contentType = 'json';
        res.send(result);
    } catch(err) {
        res.status(500).send(err);
    }
});

router.post('/password-check', async (req, res, next) => {
    try {
        await connectDB();
        const user = await SQUser.findOne({
            where: { email: req.params.email }
        });
        let checked;
        if (!user) {
            checked = {
                check: false, email: req.params.email,
                message: "Could not find user"
            };
        } else if (user.email === req.params.email 
            && user.password === req.params.password
            && user.valid === 'true'
        ) {
            checked = {
                check: true,
                email: user.email
            };
        } else {
            checked = {
                check: false, email: req.params.email,
                message: "Incorrect password"
            };
        }
        res.contentType = 'json';
        res.send(checked);
    } catch(err) {
        res.status(500).send(err);
    }
});
