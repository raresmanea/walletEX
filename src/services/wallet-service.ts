import { Wallet } from '../models/wallet';
import { PostgresWalletRepository } from '../repositories/postgres-wallet-repository';

export class WalletService {
    private walletRepository: PostgresWalletRepository;
    private maxRetries: number = 3;

    constructor(walletRepository: PostgresWalletRepository) {
        this.walletRepository = walletRepository;
    }

    public async creditWallet(walletId: string, transactionId: string, coins: number): Promise<Wallet> {
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                let wallet = await this.walletRepository.getWalletById(walletId);
                if (!wallet) {
                    wallet = new Wallet(0);
                }
                if (wallet.getLastTransactionId() === transactionId) {
                    throw new Error("Transaction already processed");
                }

                wallet.credit(transactionId, coins);
                return await this.walletRepository.saveWallet(walletId, wallet);
            } catch (error) {
                if (error instanceof Error && error.message === 'Concurrent update detected' && retries < this.maxRetries - 1) {
                    retries++;
                    continue;
                }
                console.error("Error crediting wallet:", error);
                throw error;
            }
        }
        throw new Error("Max retries reached");
    }

    public async debitWallet(walletId: string, transactionId: string, coins: number): Promise<Wallet> {
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                const wallet = await this.walletRepository.getWalletById(walletId);
                if (!wallet) {
                    throw new Error("Wallet not found");
                }

                if (wallet.getLastTransactionId() === transactionId) {
                    throw new Error("Transaction already processed");
                }

                const success = wallet.debit(transactionId, coins);
                if (!success) {
                    throw new Error("Insufficient balance");
                }

                return await this.walletRepository.saveWallet(walletId, wallet);
            } catch (error) {
                if (error instanceof Error && error.message === 'Concurrent update detected' && retries < this.maxRetries - 1) {
                    retries++;
                    continue;
                }
                console.error("Error debiting wallet:", error);
                throw error;
            }
        }
        throw new Error("Max retries reached");
    }

    public async getWallet(walletId: string): Promise<Wallet | null> {
        return await this.walletRepository.getWalletById(walletId);
    }
}