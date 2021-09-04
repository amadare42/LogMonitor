# Logs Monitor

---

Application that allow to monitor logs from multiple clients in real time.

Server will not retain any received logs, but broadcast them to registered listeners.

Viewer app features highlights:

- ability to display very large amount of entries
- filtering by multiple criteria, ability to hide logs from specific actor
- bookmarks
- ability to save logs to local file

## Post message

`/logs/add` endpoint accepts object of type

```ts
{
    timetamp: 1630712587111,// unix timestamp in ms
    level: "INFO",          // TRACE | DEBUG | INFO | WARN  | ERROR
    // (optional) full message override
    text: "02:46:35:975  [INFO] log message",    
    msg: "log message",     // actual log entry
    user: "fred",           // name of entry owner
    room: 'my-room'         // used to group logs
}
```

## Watch logs

To watch logs, open `/logs?room=<roomname>` page in browser. If room is not specified, you will receive log entries from all rooms.

To listen logs, use `/logs/listen?room=<roomname>` websockets endpoint. Log entries have the following type

```ts
interface LogEntry {
    // client provided time
    timestamp?: string | number,
    room?: string,
    level: string,
    msg: string,
    user: string,
    // server time when message received
    serverTime: number,
    // sequential number that should be used to determine message order
    seqNumber: number
}
```

## Saving logs

Server will not save any received logs, only push them to listeners. So if you want to save them for later reference you can use "save" button in client. It will save them to browser localstorage. You can also use menu and "Download as file" button to save logs as json

Alternatively, you can run `log-dumper` utility that will listen logs server and dump it to local sqlite. To run, use `npm start log-dumper` command.

## Run

`npm start` - start server

# License

MIT
