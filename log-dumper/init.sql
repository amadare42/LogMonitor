create table if not exists LogEntry
(
    Id INTEGER
    constraint LogEntry_pk
    primary key autoincrement,
    client_time datetime,
    level varchar(10),
    msg text,
    user text,
    room text,
    server_time datetime,
    seq_number bigint,
    text text
);

create unique index if not exists LogEntry_Id_uindex
    on LogEntry (Id)

