import { Wallet } from '../models/wallet';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class PostgresWalletRepository {
    private client: Client;

    constructor() {
        this.client = new Client({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        this.connect().then(() => this.provisionDatabase());;
    }
    
    private async provisionDatabase(): Promise<void> {
        const createSchemaQuery = `
            CREATE SCHEMA IF NOT EXISTS wallet;
        `;
    
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS wallet.wallets (
                id UUID PRIMARY KEY,
                balance INTEGER NOT NULL,
                version INTEGER NOT NULL,
                last_transaction_id VARCHAR(255)
            );
        `;
    
        try {
            // Create the wallet schema
            await this.client.query(createSchemaQuery);
            console.log('Schema "wallet" provisioned successfully.');
    
            // Now create the wallets table
            await this.client.query(createTableQuery);
            console.log('Table "wallet.wallets" provisioned successfully.');
        } catch (err) {
            console.error('Error provisioning database:', err);
        }
    }

    private async connect(): Promise<void> {
        try {
            await this.client.connect();
            console.log('Connected to the database successfully.');
        } catch (err) {
            console.error('Database connection error:', err);
            process.exit(1); // Exit process on connection failure
        }
    }

    public async getWalletById(walletId: string): Promise<Wallet | null> {
        const query = 'SELECT * FROM wallet.wallets WHERE id = $1';
        try {
            const result = await this.client.query(query, [walletId]);
            if (result.rows.length === 0) {
                return null;
            }

            const walletData = result.rows[0];
            const wallet = new Wallet(walletData.balance);
            wallet.setVersion(walletData.version);
            wallet.setLastTransactionId(walletData.last_transaction_id);

            return wallet;
        } catch (err) {
            console.error('Error fetching wallet by ID:', err);
            throw new Error('Failed to retrieve wallet.');
        }
    }

    public async saveWallet(walletId: string, wallet: Wallet): Promise<void> {
        const query = `
            INSERT INTO wallet.wallets (id, balance, version, last_transaction_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET balance = $2, version = $3, last_transaction_id = $4;
        `;

        try {
            await this.client.query(query, [
                walletId,
                wallet.getBalance(),
                wallet.getVersion(),
                wallet.getLastTransactionId()
            ]);
        } catch (err) {
            console.error('Error saving wallet:', err);
            throw new Error('Failed to save wallet.');
        }
    }

    public async closeConnection(): Promise<void> {
        try {
            await this.client.end();
            console.log('Database connection closed.');
        } catch (err) {
            console.error('Error closing the database connection:', err);
        }
    }
}

export { PostgresWalletRepository };
