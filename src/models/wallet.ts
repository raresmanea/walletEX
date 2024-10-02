export class Wallet {
    private balance: number;
    private version: number;
    private lastTransactionId: string | null;

    constructor(initialBalance: number) {
        if (initialBalance < 0) {
            throw new Error("Initial balance cannot be negative.");
        }

        this.balance = initialBalance;
        this.version = 0;
        this.lastTransactionId = null;
    }

    public getBalance(): number {
        return this.balance;
    }

    public getVersion(): number {
        return this.version;
    }

    public getLastTransactionId(): string | null {
        return this.lastTransactionId;
    }

    public setVersion(version: number): void {
        this.version = version;
    }

    public setLastTransactionId(transactionId: string | null): void {
        this.lastTransactionId = transactionId;
    }

    public incrementVersion(): void {
        this.version++;
    }

    public credit(transactionId: string, amount: number): void {
        if (!this.isValidTransaction(transactionId)) {
            throw new Error("Invalid transaction ID.");
        }
        if (amount <= 0) {
            throw new Error("Credit amount must be greater than zero.");
        }

        this.updateWalletState(transactionId, amount);
        this.incrementVersion();
    }

    public debit(transactionId: string, amount: number): boolean {
        if (!this.isValidTransaction(transactionId)) {
            throw new Error("Invalid transaction ID.");
        }
        if (amount <= 0) {
            throw new Error("Debit amount must be greater than zero.");
        }
        if (amount > this.balance) {
            return false; 
        }

        this.updateWalletState(transactionId, -amount);
        this.incrementVersion();
        return true;
    }

    private isValidTransaction(transactionId: string): boolean {
        return transactionId !== null && transactionId.trim() !== '';
    }

    private updateWalletState(transactionId: string, amount: number): void {
        this.balance += amount;
        this.lastTransactionId = transactionId;
    }
}