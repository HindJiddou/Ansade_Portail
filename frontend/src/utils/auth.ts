export const getUserFromLocalStorage = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => !!getUserFromLocalStorage();
export const isAdminOrChef = (): boolean => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.is_chef || user?.is_superuser;
};

export const isChef = () => {
  const user = getUserFromLocalStorage();
  return user && user.is_chef;
  
};
