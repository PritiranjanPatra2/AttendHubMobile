import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../utils/api";

// === Types ===
export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  department: string;
  photoURL: string;
  role: string;
  status: string;
  statusUpdatedAt: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
    department: string,
    photoUri?: string
  ) => Promise<void>;
  updateProfile: (data: { department?: string; photoUri?: string,phone?:string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

// === Create Context ===
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// === Provider ===
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base API URL

  // Axios instance

  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("authToken");
        if (savedToken) {
          await fetchProfile();
        }
      } catch (err) {
        console.error("Failed to load token", err);
      }
    };
    loadToken();
  }, []);

  // === Login ===
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data.success) {
        console.log(res.data);
        
        const { token: newToken, user: userData } = res.data.data;
        await AsyncStorage.setItem("authToken", newToken); 
        
        setUser(userData);
      } else {
        throw new Error(res.data.message || "Login failed");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // === Register ===
  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    department: string,
    photoUri?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("department", department);

      if (photoUri) {
        const filename = photoUri.split("/").pop() || "photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("photo", {
          uri: photoUri,
          name: filename,
          type,
        } as any);
      }

      const res = await api.post("/auth/register", formData,{
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const { token: newToken, user: userData } = res.data.data;
        await AsyncStorage.setItem("authToken", newToken); // Save token
       
        setUser(userData);
      } else {
        throw new Error(res.data.message || "Registration failed");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Registration failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // === Fetch Profile ===
  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/auth/me",{ headers: { Authorization: `Bearer ${token}` } });
      console.log(res.data);
      
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to fetch profile";
      setError(msg);
      if (err.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // === Update Profile ===
  const updateProfile = async (data: { department?: string; photoUri?: string;phone?:string; }) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();

      if (data.department) {
        formData.append("department", data.department);
      }

      if (data.photoUri) {
        const filename = data.photoUri.split("/").pop() || "photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("photo", {
          uri: data.photoUri,
          name: filename,
          type,
        } as any);
      }
      if (data.phone) {
        formData.append("phone", data.phone);
      }
      console.log(formData);
      

      const res = await api.put("/auth/me", formData,{
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`, 
          },
        });
      console.log(res.data);
      

      if (res.data.success) {
        setUser(res.data.data);
      } else {
        throw new Error(res.data.message || "Update failed");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // === Logout ===
  const logout = async () => {
    setUser(null);
  await AsyncStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        updateProfile,
        logout,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// === Custom Hook ===
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};