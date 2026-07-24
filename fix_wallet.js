const fs = require("fs");
let content = fs.readFileSync("src/features/finance/services/wallet.service.ts", "utf8");

// Replacements for wallet functions
content = content.replace(/export async function getWalletHistory\([\s\S]*?\n\}\n/g, "export async function getWalletHistory(userId: string, walletId?: string | null, page = 1): Promise<WalletHistoryDTO> { return { wallet: { id: \"\", balance: 0 }, data: [], meta: { total: 0, page: 1, totalPages: 1 } } }\n");
content = content.replace(/export async function getWalletSettings\([\s\S]*?\n\}\n/g, "export async function getWalletSettings(userId: string): Promise<WalletSettingsDTO> { return { hasPin: false, dailyLimit: 0 } }\n");
content = content.replace(/export async function updateWalletSettings\([\s\S]*?\n\}\n/g, "export async function updateWalletSettings(userId: string, pin?: string, dailyLimit?: number) { return { success: true } }\n");
content = content.replace(/export async function createManualTopup\([\s\S]*?\n\}\n/g, "export async function createManualTopup(params: any) { return { message: \"Transaksi manual berhasil dibuat\", redirectUrl: \"\" } }\n");
content = content.replace(/export async function submitManualTopupProof\([\s\S]*?\n\}\n/g, "export async function submitManualTopupProof(paymentId: string, proofUrl: string) { return { success: true, url: proofUrl } }\n");
content = content.replace(/export async function verifyWalletOwnership\([\s\S]*?\n\}\n/g, "export async function verifyWalletOwnership(walletId: string, userId: string) { return null }\n");

fs.writeFileSync("src/features/finance/services/wallet.service.ts", content, "utf8");
