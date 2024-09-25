import { Wallet } from '../models/wallet';

interface WalletRepository {
    getWalletById(walletId: string): Wallet | undefined;
    saveWallet(walletId: string, wallet: Wallet): void;
}

class InMemoryWalletRepository implements WalletRepository {
    private wallets: Map<string, Wallet>;

    constructor() {
        this.wallets = new Map();
    }

    getWalletById(walletId: string): Wallet | undefined {
        return this.wallets.get(walletId);
    }

    saveWallet(walletId: string, wallet: Wallet): void {
        this.wallets.set(walletId, wallet);
    }
}

export { InMemoryWalletRepository, WalletRepository };
