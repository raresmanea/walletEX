import { Wallet } from '../models/wallet';
import { PostgresWalletRepository } from '../repositories/postgres-wallet-repository';

export class WalletService {
    private walletRepository: PostgresWalletRepository;

    constructor(walletRepository: PostgresWalletRepository) {
        this.walletRepository = walletRepository;
    }

    public async creditWallet(walletId: string, transactionId: string, coins: number): Promise<Wallet> {
        return this.walletRepository.getWalletById(walletId)
            .then(wallet => {
                if (wallet === null) {
                    wallet = new Wallet(0); 
                  }
                if (wallet.getLastTransactionId() === transactionId) {
                    throw new Error("Transaction already processed");
                }

                wallet.credit(transactionId, coins);
                return this.walletRepository.saveWallet(walletId, wallet);
            })
            .then(wallet => wallet)
            .catch(error => {
                console.error("Error crediting wallet:", error);
                throw error;
            });
    }

    public async debitWallet(walletId: string, transactionId: string, coins: number): Promise<Wallet> {
        return this.walletRepository.getWalletById(walletId)
            .then(wallet => {
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

                return this.walletRepository.saveWallet(walletId, wallet);
            })
            .then(wallet => wallet)
            .catch(error => {
                console.error("Error debiting wallet:", error);
                throw error;
            });
    }

    public async getWallet(walletId: string): Promise<Wallet | null> {
        return await this.walletRepository.getWalletById(walletId);
    }
}
