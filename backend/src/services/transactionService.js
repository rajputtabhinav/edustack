import { Transaction } from "../models/Transaction.js";

export async function createTransaction(payload) {
  return Transaction.create(payload);
}

export async function getUserTransactions(userId) {
  return Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean();
}
