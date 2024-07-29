export const hexToString = (hexStr) => {
  let str = '';
  for (let i = 0; i < hexStr.length; i += 2) {
    const hexValue = hexStr.substr(i, 2);
    const decimalValue = parseInt(hexValue, 16);
    str += String.fromCharCode(decimalValue);
  }
  return str;
};
