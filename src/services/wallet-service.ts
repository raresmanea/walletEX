import { Wallet } from '../models/wallet';
import { PostgresWalletRepository } from '../repositories/postgres-wallet-repository';

export class WalletService {
    private walletRepository: PostgresWalletRepository;

    constructor(walletRepository: PostgresWalletRepository) {
        this.walletRepository = walletRepository;
    }

    public async creditWallet(walletId: string, transactionId: string, coins: number): Promise<Wallet> {
        let wallet = await this.walletRepository.getWalletById(walletId);

        if (!wallet) {
            wallet = new Wallet(0); // Initialize with 0 balance if wallet does not exist
        }

        if (wallet.getLastTransactionId() === transactionId) {
            throw new Error("Transaction already processed");
        }

        wallet.credit(transactionId, coins);
        await this.walletRepository.saveWallet(walletId, wallet);

        return wallet;
    }

    public async debitWallet(walletId: string, transactionId: string, coins: number): Promise<Wallet> {
        let wallet = await this.walletRepository.getWalletById(walletId);

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

        await this.walletRepository.saveWallet(walletId, wallet);
        return wallet;
    }

    public async getWallet(walletId: string): Promise<Wallet | null> {
        return await this.walletRepository.getWalletById(walletId);
    }
}
