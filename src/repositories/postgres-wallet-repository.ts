import { Wallet } from '../models/wallet';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class PostgresWalletRepository {
    private static instance: PostgresWalletRepository;
    private pool: Pool;
    private isProvisioned: boolean = false;

    private constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        this.connect().then(() => this.provisionDatabase());
    }

    public static getInstance(): PostgresWalletRepository {
        if (!PostgresWalletRepository.instance) {
            PostgresWalletRepository.instance = new PostgresWalletRepository();
        }
        return PostgresWalletRepository.instance;
    }

    private async connect(): Promise<void> {
        try {
            await this.pool.connect();
            console.log('Connected to the database successfully.');
        } catch (err) {
            console.error('Database connection error:', err);
            process.exit(1);
        }
    }

    private async provisionDatabase(): Promise<void> {
        if (this.isProvisioned) {
            console.log('Database already provisioned.');
            return;
        }

        const createSchemaQuery = `CREATE SCHEMA IF NOT EXISTS wallet;`;
    
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS wallet.wallets (
                id UUID PRIMARY KEY,
                balance INTEGER NOT NULL,
                version INTEGER NOT NULL,
                last_transaction_id VARCHAR(255)
            );
        `;
    
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(createSchemaQuery);
            console.log('Schema "wallet" provisioned successfully.');
            await client.query(createTableQuery);
            console.log('Table "wallet.wallets" provisioned successfully.');
            await client.query('COMMIT');
            this.isProvisioned = true; 
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error provisioning database:', err);
        } finally {
            client.release();
        }
    }

    public async getWalletById(walletId: string): Promise<Wallet | null> {
        const query = 'SELECT * FROM wallet.wallets WHERE id = $1';
        const client = await this.pool.connect();
        try {
            const result = await client.query(query, [walletId]);
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
        } finally {
            client.release();
        }
    }

    public async saveWallet(walletId: string, wallet: Wallet): Promise<Wallet> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const query = `
                INSERT INTO wallet.wallets (id, balance, version, last_transaction_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE 
                SET balance = $2, version = $3, last_transaction_id = $4
                WHERE wallet.wallets.version < $3
                RETURNING *;
            `;
            const result = await client.query(query, [
                walletId,
                wallet.getBalance(),
                wallet.getVersion(),
                wallet.getLastTransactionId()
            ]);
            
            if (result.rows.length === 0) {
                throw new Error('Concurrent update detected');
            }
            
            await client.query('COMMIT');
            return wallet;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error saving wallet:', err);
            throw new Error('Failed to save wallet.');
        } finally {
            client.release();
        }
    }

    public async closeConnection(): Promise<void> {
        try {
            await this.pool.end();
            console.log('Database connection closed.');
        } catch (err) {
            console.error('Error closing the database connection:', err);
        }
    }
}

export { PostgresWalletRepository };