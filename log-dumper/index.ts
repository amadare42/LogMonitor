import { open, Database } from 'sqlite';
import * as fs from 'fs';
import * as WebSocket from 'ws';

require('dotenv').config();
if (!process.env.WS_ENDPOINT || !process.env.DB_FILENAME) {
    throw "Specify WS_ENDPOINT and DB_FILENAME values in .env!";
}

const wsEndpoint = process.env.WS_ENDPOINT;


async function openOrCreateDb() {
    const db = await open({
        filename: process.env.DB_FILENAME,
        driver: require("sqlite3").Database
    })

    await db.exec(fs.readFileSync('init.sql').toString());
    return db;
}


function listen(db: Database) {
    let ws = new WebSocket(wsEndpoint);
    ws.on('open', () => console.log('connected!'));
    setInterval(() => {
        ws.ping()
    }, 3000);
    ws.on('close', () => {
        console.log('connection closed. Reconnecting...');
        function reconnect() {
            console.log('connection closed. Reconnecting...');
            ws = new WebSocket(wsEndpoint);
            ws.on('open', () => console.log('reconnected!'));
            ws.on('message', onMessage(db));
            ws.on('close', () => setTimeout(reconnect, 2000))
        }
        setTimeout(reconnect, 2000);
    });

    ws.on('message', onMessage(db));
}

const onMessage = (db: Database) => async (wsData: any) => {
    const msg = parseData(wsData);
    await (msg instanceof Array
        ? Promise.all(msg.map(e => insert(e, db)))
        : insert(msg, db));
}

function parseData(data: WebSocket.Data) {
    if (typeof data != 'string') {
        throw 'unknown data type';
    }
    try {
        return JSON.parse(data)
    } catch (e){
        console.log(e);
        throw e;
    }
}


async function insert(entry: LogEntry, db: Database) {
    let args = [
        entry.timestamp ? new Date(parseInt(entry.timestamp)) : null,
        entry.level,
        entry.msg,
        entry.user,
        !entry.room || entry.room == 'undefined' ? null : entry.room,
        new Date(entry.serverTime),
        entry.seqNumber,
        formatMsg(entry)
    ]
    await db.run(`INSERT INTO LogEntry (client_time, level, msg, [user], room, server_time, seq_number, text) 
VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, ...args)
}

function formatMsg(msg) {
    return `${formatDate(msg.timestamp)} [${msg.level}] ${msg.msg}`;
}

function formatDate(timestamp) {
    const date = new Date(parseInt(timestamp));
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds() % 1000).padEnd(3, '0');
    return `${hours}:${minutes}:${seconds}:${ms} `;
}


openOrCreateDb().then(listen);


interface LogEntry {
    timestamp?: string,
    level: string,
    msg: string,
    user: string,
    room?: string,
    serverTime: number,
    seqNumber: number
}
