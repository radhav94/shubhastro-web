export const saveUserToStorage = (user) => {
  if (!user) return;

  const filteredUser = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    email: user.email || null,
    place: user.place,
    role: user.role,
    languagePreferences: user.languagePreferences || [],
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
  };

  localStorage.setItem("shubhtalk_user", JSON.stringify(filteredUser));
};

export const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("shubhtalk_user"));
  } catch {
    return null;
  }
};