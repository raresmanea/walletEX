CREATE TABLE wallet.wallets (
    id SERIAL PRIMARY KEY,
    wallet_id VARCHAR(255) UNIQUE NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    version INT NOT NULL,
    coins INT NOT NULL
);