const fs = require("fs");
let content = fs.readFileSync("src/features/finance/services/payment.service.ts", "utf8");

content = content.replace(/if \\(payment\\.plan === "WALLET_TOPUP"\\) \\{[\\s\\S]*?\\} else if \\(payment\\.plan === "INVOICE"\\) \\{[\\s\\S]*?\\} else if \\(payment\\.plan === "AI_TOKEN_USER"\\)/, "if (payment.plan === \\"AI_TOKEN_USER\\")");

content = content.replace(/updateData.studentQuota = plan\\?\\.maxStudents \\|\\| 0/g, "");
content = content.replace(/updateData.studentQuota = \\{ increment: \\(payment.metadata as any\\)\\?\\.studentCount \\|\\| 0 \\}/g, "");

fs.writeFileSync("src/features/finance/services/payment.service.ts", content, "utf8");
