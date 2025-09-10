// This file is deprecated - zkLogin uses Firestore-based roles in zkRoles.ts
// Keeping file for compatibility but functionality moved to zkRoles.ts

export const setTestRole = () => {
  console.warn('setTestRole is deprecated. Use setUserRole from zkRoles.ts instead');
};

export const getTestRole = () => {
  console.warn('getTestRole is deprecated. Use getUserRole from zkRoles.ts instead');
  return null;
};

export const clearTestRoles = () => {
  console.warn('clearTestRoles is deprecated. Role management now uses Firestore');
};
