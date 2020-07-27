import EthersUtils from "ethers-utils";

export function formatUnits(
  value,
  {
    digits = 18,
    commas = false,
    replaceZeroBy = "",
    truncateToDecimalPlace
  } = {}
) {
  if (typeof value === "string") {
    value = new EthersUtils.BigNumber(value);
  }

  if (value.lt(0) || digits < 0) {
    return "";
  }

  let valueBeforeCommas = EthersUtils.formatUnits(value.toString(), digits);

  // Replace 0 by an empty value
  if (valueBeforeCommas === "0.0") {
    return replaceZeroBy;
  }

  // EthersUtils.formatUnits() adds a decimal even when 0, this removes it.
  valueBeforeCommas = valueBeforeCommas.replace(/\.0$/, "");

  if (typeof truncateToDecimalPlace === "number") {
    const [whole = "", dec = ""] = valueBeforeCommas.split(".");
    if (dec) {
      const truncatedDec = dec
        .slice(0, truncateToDecimalPlace)
        .replace(/0*$/, "");
      valueBeforeCommas = truncatedDec ? `${whole}.${truncatedDec}` : whole;
    }
  }
  return commas ? EthersUtils.commify(valueBeforeCommas) : valueBeforeCommas;
}

/**
 * Shorten an Ethereum address. `charsLength` allows to change the number of
 * characters on both sides of the ellipsis.
 *
 * Examples:
 *   shortenAddress('0x19731977931271')    // 0x1973‚Äö√Ñ¬∂1271
 *   shortenAddress('0x19731977931271', 2) // 0x19‚Äö√Ñ¬∂71
 *   shortenAddress('0x197319')            // 0x197319 (already short enough)
 *
 * @param {string} address The address to shorten
 * @param {number} [charsLength=4] The number of characters to change on both sides of the ellipsis
 * @returns {string} The shortened address
 */
export function shortenAddress(address, charsLength = 4) {
  const prefixLength = 2; // "0x"
  if (!address) {
    return "";
  }
  if (address.length < charsLength * 2 + prefixLength) {
    return address;
  }
  return (
    address.slice(0, charsLength + prefixLength) +
    "..." +
    address.slice(-charsLength)
  );
}
