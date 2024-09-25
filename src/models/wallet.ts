export class Wallet {
    private balance: number;
    private version: number;
    private lastTransactionId: string | null;

    constructor(initialBalance: number) {
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

    public credit(transactionId: string, amount: number): void {
        this.balance += amount;
        this.lastTransactionId = transactionId;
        this.version += 1;
    }

    public debit(transactionId: string, amount: number): boolean {
        if (amount > this.balance) {
            return false; 
        }
        this.balance -= amount;
        this.lastTransactionId = transactionId;
        this.version += 1; 
        return true;
    }
}
