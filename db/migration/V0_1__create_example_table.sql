CREATE TABLE IF NOT EXISTS wallet.example_table (
    id bigserial not null
    constraint wallet_id_pk
    primary key not null,
    first_name text not null,
    last_name integer not null
);

