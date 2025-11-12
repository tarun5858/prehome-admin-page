import bcrypt from "bcryptjs";

let adminUser = process.env.ADMIN_USER || "admin";
let adminPassHash = process.env.ADMIN_PASS_HASH || "$2b$10$w0X2YF.gE8S0tF/QY7N5iO5dG.K0x0fR.Z9pT";

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
