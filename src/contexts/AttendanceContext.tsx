// contexts/AttendanceContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ToastAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../utils/api";

// ==== Types ====
interface AttendanceContextType {
  loading: boolean;
  error: string | null;
  updateStatus: (newStatus: string) => Promise<boolean>;
  markAttendance: () => Promise<boolean>;
  getMyAttendance: (month: string) => Promise<{ success: boolean; data: string[] } | null>;
}

interface AttendanceProviderProps {
  children: ReactNode;
}

// ==== Context ====
const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// ==== Provider ====
export const AttendanceProvider: React.FC<AttendanceProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("authToken");
  };

  // Update Status
  const updateStatus = useCallback(async (newStatus: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        ToastAndroid.show("Not authenticated", ToastAndroid.SHORT);
        return false;
      }

      const res = await api.patch(
        "/auth/status",
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        return true;
      } else {
        ToastAndroid.show("Failed to update status", ToastAndroid.SHORT);
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update status";
      setError(msg);
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark Attendance
  const markAttendance = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        ToastAndroid.show("Not authenticated", ToastAndroid.SHORT);
        return false;
      }

      const res = await api.post(
        "/attendance/mark",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Auto-set status to "In Office"
        await updateStatus("In Office");

        // Save local flag
        await AsyncStorage.setItem(
          "MarkedAttendanceStatus",
          JSON.stringify({
            date: new Date().toDateString(),
            markedToday: true,
          })
        );

        ToastAndroid.show("Attendance marked successfully", ToastAndroid.SHORT);
        return true;
      } else {
        const msg = res.data.message || "Failed to mark attendance";
        ToastAndroid.show(msg, ToastAndroid.SHORT);
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to mark attendance";
      setError(msg);
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  // Get Monthly Attendance
  const getMyAttendance = useCallback(async (month: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return null;

      const res = await api.get(`/attendance/me?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res.data);
      

      if (res.data.success) {
        return { success: true, data: res.data.data || [] };
      } else {
        ToastAndroid.show("Failed to load attendance", ToastAndroid.SHORT);
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load attendance";
      setError(msg);
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AttendanceContext.Provider
      value={{
        loading,
        error,
        updateStatus,
        markAttendance,
        getMyAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

// ==== Hook ====
export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within AttendanceProvider");
  }
  return context;
};