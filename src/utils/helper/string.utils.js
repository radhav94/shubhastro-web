export function Length(stringData) {
  if (stringData === undefined) {
    return 0;
  }
  if (stringData === null) {
    return 0;
  }
  return stringData.length;
}

export function GetString(stringData, length) {
  const lengthOfSource = Length(stringData);
  if (lengthOfSource <= length) {
    return stringData;
  }

  return stringData.substring(0, length - 1) + "...";
}
