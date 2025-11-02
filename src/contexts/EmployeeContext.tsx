import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { api } from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// === Types ===
export interface Employee {
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

export interface TeamMember {
  _id: string;
  name: string;
  department: string;
  photoURL: string;
  status: string;
  statusUpdatedAt: string;
}

export interface TeamResponse {
  users: TeamMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface EmployeeContextType {
  employee: Employee | null;
  team: TeamMember[];
  teamPagination: TeamResponse["pagination"] | null;
  loading: boolean;
  error: string | null;
  fetchEmployee: (id: string) => Promise<void>;
  fetchTeam: (page?: number, limit?: number, search?: string) => Promise<void>;
}

// === Create Context ===
const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

// === Provider ===
export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamPagination, setTeamPagination] = useState<TeamResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = useCallback(async () => {
    const token = await AsyncStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchEmployee = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const res = await api.get(`/auth/employee/${id}`, { headers });

      if (res.data.success) {
        setEmployee(res.data.data);
      } else {
        throw new Error(res.data.message || "Failed to fetch employee");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to fetch employee";
      setError(msg);
      console.error("Fetch Employee Error:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  // Memoized fetchTeam
  const fetchTeam = useCallback(async (page = 1, limit = 10, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const params: any = { page, limit };
      if (search) params.search = search;

      const res = await api.get("/auth/team", { headers, params });

      if (res.data.success) {
        setTeam(res.data.data.users);
        setTeamPagination(res.data.data.pagination);
      } else {
        throw new Error(res.data.message || "Failed to fetch team");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to fetch team";
      setError(msg);
      console.error("Fetch Team Error:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  return (
    <EmployeeContext.Provider
      value={{
        employee,
        team,
        teamPagination,
        loading,
        error,
        fetchEmployee,
        fetchTeam,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

// === Custom Hook ===
export const useEmployee = (): EmployeeContextType => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }
  return context;
};