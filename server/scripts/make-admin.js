require("dotenv").config();
const prisma = require("../src/db");

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: node scripts/make-admin.js <username>");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { username },
    data: { role: "ADMIN" },
  });
  console.log(`${user.username} is now an ADMIN. Log in again to get a new token.`);
}

main()
  .catch((err) => {
    console.error(err.code === "P2025" ? "No user with that username." : err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());