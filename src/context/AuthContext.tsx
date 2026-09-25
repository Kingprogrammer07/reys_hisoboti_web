import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";

export interface AuthUser {
  username: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pinOrPassword: string, username?: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const res = await authApi.getMe();
      if (res.authenticated && res.user) {
        setUser({ username: res.user });
        setIsAuthenticated(true);
        localStorage.setItem("reys_user", res.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("reys_token");
        localStorage.removeItem("reys_user");
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("reys_token");
      localStorage.removeItem("reys_user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (pinOrPassword: string, username: string = "admin"): Promise<boolean> => {
    const res = await authApi.login({
      username,
      password: pinOrPassword,
      pin: pinOrPassword,
    });

    if (res.ok) {
      const activeUser = res.user || username;
      setUser({ username: activeUser });
      setIsAuthenticated(true);
      if (res.token) {
        localStorage.setItem("reys_token", res.token);
      }
      localStorage.setItem("reys_user", activeUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("reys_token");
      localStorage.removeItem("reys_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
