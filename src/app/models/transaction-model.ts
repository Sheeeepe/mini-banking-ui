export interface TransactionModel {
    id: number;
    account_id: number;
    type: 'deposit' | 'withdrawal';
    amount: number;
    description: string;
    balance_after: number;
    created_at: Date;
}
