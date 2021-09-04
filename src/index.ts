import * as express from 'express';
import * as http from "http";
import { registerLogger } from './modules/logMonitoring';
import { shimConsole } from './util/logging';
import { registerPublicDir } from './modules/publicDir';
var cors = require('cors');

shimConsole(console, '[console]');

const app = express();
const server = http.createServer(app);
app.use(express.json())
app.use(cors());
app.set('json spaces', 2);

registerPublicDir(app);
registerLogger(app, server, '');

server.listen(process.env.PORT || 5001, () => console.log('started!'));
