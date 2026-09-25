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
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem("reys_token");
    const savedUser = localStorage.getItem("reys_user");
    return token && savedUser ? { username: savedUser } : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("reys_token");
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !localStorage.getItem("reys_token");
  });

  const clearSession = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("reys_token");
    localStorage.removeItem("reys_user");
  };

  const checkAuth = async () => {
    try {
      if (!localStorage.getItem("reys_token")) {
        setIsLoading(true);
      }
      const res = await authApi.getMe();
      if (res.authenticated && res.user) {
        setUser({ username: res.user });
        setIsAuthenticated(true);
        localStorage.setItem("reys_user", res.user);
      } else {
        clearSession();
      }
    } catch (err) {
      if (!localStorage.getItem("reys_token")) {
        clearSession();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("reys:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("reys:unauthorized", handleUnauthorized);
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
      clearSession();
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
