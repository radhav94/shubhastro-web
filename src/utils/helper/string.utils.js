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

// Get astrologer display name - prioritize userName, fallback to firstName + lastName
export function getAstrologerDisplayName(astrologer) {
  // If userName exists and is not empty or blank, use it
  if (astrologer?.userName && astrologer.userName.trim()) {
    return astrologer.userName;
  }
  // Otherwise, combine firstName and lastName
  const firstName = astrologer?.firstName || "";
  const lastName = astrologer?.lastName || "";
  return `${firstName} ${lastName}`.trim();
}
