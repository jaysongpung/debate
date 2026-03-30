"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "@shared/types";

interface AuthContextType {
  user: User | null;
  login: (nickname: string, studentId: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("debate-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (
    nickname: string,
    studentId: string
  ): Promise<boolean> => {
    const snap = await getDoc(doc(db, "users", nickname));
    if (!snap.exists()) return false;

    const data = snap.data();
    if (data.studentId !== studentId) return false;

    const userData: User = {
      nickname: data.nickname,
      studentId: data.studentId,
      role: data.role,
    };
    setUser(userData);
    localStorage.setItem("debate-user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("debate-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
