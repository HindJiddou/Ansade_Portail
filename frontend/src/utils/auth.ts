export const getUserFromLocalStorage = () => {
  const user = sessionStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!sessionStorage.getItem("access");
};
export const isAdminOrChef = (): boolean => {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  return user?.is_chef || user?.is_superuser;
};

export const isChef = () => {
  const user = getUserFromLocalStorage();
  return user && user.is_chef;
  
};
