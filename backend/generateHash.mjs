import bcrypt from "bcrypt";

const run = async () => {
  const password = "admin123"; // change if you want another password
  const hash = await bcrypt.hash(password, 10);
  console.log(`🔐 Hash for "${password}":`, hash);
};

run();