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

        this.client.connect()
            .then(() => this.provisionDatabase())
            .catch(err => console.error('Connection error', err.stack));
    }

    private async provisionDatabase(): Promise<void> {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS wallet.wallets (
                id UUID PRIMARY KEY,
                balance INTEGER NOT NULL,
                version INTEGER NOT NULL,
                last_transaction_id VARCHAR(255)
            );
        `;

        try {
            await this.client.query(createTableQuery);
            console.log('Database provisioned successfully.');
        } catch (err) {
            console.error('Error provisioning database:', err);
        }
    }
    public async getWalletById(walletId: string): Promise<Wallet | null> {
        const result = await this.client.query('SELECT * FROM wallet.wallets WHERE id = $1', [walletId]);
        
        if (result.rows.length === 0) {
            return null; // No wallet found
        }

        const walletData = result.rows[0];
        const wallet = new Wallet(walletData.balance); 
        wallet.setVersion(walletData.version); 
        wallet.setLastTransactionId(walletData.last_transaction_id);
        
        return wallet;
    }

    public async saveWallet(walletId: string, wallet: Wallet): Promise<void> {
        await this.client.query(
            'INSERT INTO wallet.wallets (id, balance, version, last_transaction_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET balance = $2, version = $3, last_transaction_id = $4',
            [walletId, wallet.getBalance(), wallet.getVersion(), wallet.getLastTransactionId()]
        );
    }

    public async closeConnection(): Promise<void> {
        await this.client.end();
        console.log('Database connection closed.');
    }
}

export { PostgresWalletRepository };