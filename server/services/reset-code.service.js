// In-memory store for reset codes (email -> { code, expires, validated })
const resetCodes = new Map();

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createCode = (email) => {
  const code = generateCode();
  const expires = Date.now() + 1000 * 60 * 15; // 15 minutes
  resetCodes.set(email, { code, expires, validated: false });
  return { code, expires };
};

const getCode = (email) => {
  return resetCodes.get(email);
};

const validateCode = (email, code) => {
  const entry = resetCodes.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expires) return false;
  if (entry.code !== String(code)) return false;
  entry.validated = true;
  resetCodes.set(email, entry);
  return true;
};

const verifyCode = (email, code) => {
  const entry = resetCodes.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expires) return false;
  if (entry.code !== String(code)) return false;
  return entry.validated === true;
};

const deleteCode = (email) => {
  resetCodes.delete(email);
};

module.exports = {
  createCode,
  getCode,
  validateCode,
  verifyCode,
  deleteCode,
};

