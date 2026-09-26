import "dotenv/config";

import prisma from "./config/db.js";

try {
    await prisma.user.count();
    console.log("DATABASE_CONNECTED");
} catch (error) {
    console.error("DATABASE_CONNECTION_FAILED:", error.message);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}