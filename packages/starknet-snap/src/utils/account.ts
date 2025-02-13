export const getDefaultAccountName = (hdIndex = 0) => {
  if (hdIndex < 0) {
    throw new Error('hdIndex cannot be negative.');
  }
  return `Account ${hdIndex + 1}`;
};
