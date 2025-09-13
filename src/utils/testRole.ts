// This file is deprecated - Firebase auth uses Firestore-based roles in roles.ts
// Keeping file for compatibility but functionality moved to roles.ts

export const setTestRole = () => {
  console.warn('setTestRole is deprecated. Use setUserRole from roles.ts instead');
};

export const getTestRole = () => {
  console.warn('getTestRole is deprecated. Use getUserRole from roles.ts instead');
  return null;
};

export const clearTestRoles = () => {
  console.warn('clearTestRoles is deprecated. Role management now uses Firestore');
};
