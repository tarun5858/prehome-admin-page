import bcrypt from "bcryptjs";

let adminUser = process.env.ADMIN_USER;
let adminPassHash = process.env.ADMIN_PASS_HASH;

export const getAdminCredentials = () => ({
  adminUser,
  adminPassHash,
});

export const updateAdminPassword = async (newPassword) => {
  const newHash = await bcrypt.hash(newPassword, 10);
  adminPassHash = newHash;
  process.env.ADMIN_PASS_HASH = newHash;
  console.log(" Admin password updated in-memory:", newHash);
};
