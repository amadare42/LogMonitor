import { RowDataPacket } from 'mysql2';
import * as _ from 'lodash';
import * as fs from 'fs';

require('dotenv').config();

import { createConnection } from './sql_utils';

type Entry = { user: string, server_time: Date, client_time: Date, msg: string, seq_number: number };

async function run() {
    process.env.SQL_CONNECTION_STRING = 'mysql://root:letmein@DESKTOP-RTN1EIJ/mh_logs';
    const connection = await createConnection();

    const time = '2021-01-24 00:00:00.000';
    const seq_start = 592982683476900 + 78058400900;
    const rsp = await connection.query(`
select user, server_time, client_time, msg, seq_number from LogEntry2 
where server_time >= '${time}' or client_time >= '${time}'
order by seq_number
`);
    const entries = (rsp[0] as Entry[]);
    let seqNumArray = entries.map(e => e.seq_number).sort();

    function getGroupKey(e: Entry) {
        if (e.msg.includes('Monsters updated:')) {
            return `monsters updated for ${e.user}`;
        }
        if (e.msg.includes('[WS] WS stream.')) {
            return `${e.user} ws stream`
        }
        if (e.msg.includes('ping. (last ping')) {
            return `${e.msg.split(' ')[0]} ping`
        }
        if (e.msg.includes("PUSH [monsters:")) {
            return `${e.user} push`
        }
        if (e.msg.includes('"type":"push"')) {
            return -1;
        }
        if (e.msg.includes('received: push')) {
            return `server received push`;
        }
        if (e.msg.includes('Data pushed.') || e.msg.includes('Active sessions:') || e.msg.startsWith('push ')) {
            return e.msg;
        }
        return null;
    }

    let acc = '';
    function addLine(line: string) {
        acc += line + '\n';
    }

    function dumpGrp() {
        for (let key of Object.keys(grp)) {
            addLine(` > ${key} (${grp[key]})`);
        }
        grp = {};
    }

    let grp = {};
    for (let i = 0; i < entries.length; i++){
        let entry = entries[i];

        let k = getGroupKey(entry)
        if (k == -1) continue;
        if (k) {
            grp[k] = (grp[k] || 0) + 1;
        } else {
            dumpGrp();
            const time: Date = (entry.server_time || entry.client_time);
            addLine(`${entry.user.padEnd(7, ' ')} | ${formatDate(time, 'HH:mm:ss.fff', false)} | ${seqNumArray.indexOf(entry.seq_number).toString().padStart(5, ' ')} | ${entry.msg}`);
        }

        if (i % 1000 == 0) {
            console.log(`${i}/${entries.length}`);
        }
    }


    dumpGrp();

    fs.writeFileSync('results4.log', acc);
    console.log('done!');
    process.exit(0);
}

function formatDate(date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len = 0) {
        var s = i + "";
        len = len || 2;
        while (s.length < len) s = "0" + s;
        return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
};

run();
