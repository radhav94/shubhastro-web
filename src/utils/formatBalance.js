/**
 * Money for display: always two decimals, Indian grouping.
 *
 *   810.000000001 -> "810.00"     1234.5 -> "1,234.50"     null -> "0.00"
 *
 * Wallet balances come back from the API / socket as floats, and per-minute
 * billing leaves binary noise on them, so rendering the raw number showed
 * values like ₹810.000000001. Display only — never use the result for maths.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export const formatBalance = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.00";
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default formatBalance;
