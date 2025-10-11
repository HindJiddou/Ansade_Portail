import React from "react";
import { Navigate } from "react-router-dom";
import { isAdminOrChef } from "../utils/auth";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  return isAdminOrChef() ? children : <Navigate to="/accueil" replace />;
};

export default ProtectedRoute;
