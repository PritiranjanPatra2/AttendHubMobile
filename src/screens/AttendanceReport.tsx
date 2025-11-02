// screens/AttendanceReport.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
  Dimensions,
  Image,
} from "react-native";
import { useAttendance } from "../contexts/AttendanceContext";
import { COLORS, DARK_COLORS } from "../colors/color";

const { width } = Dimensions.get("window");
const daySize = (width - 40) / 7; // 7 columns

export default function AttendanceReport({ navigation }: any) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DARK_COLORS : COLORS;

  const { getMyAttendance } = useAttendance();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch attendance
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
      const monthStr = `${year}-${month}`;

      const result = await getMyAttendance(monthStr);
      if (result?.success) {
        setMarkedDates(result.data || []);
      } else {
        setMarkedDates([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMarkedDates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth]);

  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const cells = []
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const week= [];

      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(<View key={`empty-${j}`} style={styles.dayCell} />);
        } else if (day > daysInMonth) {
          week.push(<View key={`end-${j}`} style={styles.dayCell} />);
        } else {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isMarked = markedDates.includes(dateStr);
          const isToday = dateStr === today;

          week.push(
            <View
              key={dateStr}
              style={[
                styles.dayCell,
                isMarked && styles.markedDay,
                isToday && styles.todayCell,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isMarked && styles.markedText,
                  isToday && styles.todayText,
                ]}
              >
                {day}
              </Text>
              {isMarked && <View style={styles.markDot} />}
            </View>
          );
          day++;
        }
      }

      cells.push(
        <View key={`week-${i}`} style={styles.weekRow}>
          {week}
        </View>
      );
      if (day > daysInMonth) break;
    }

    return cells;
  };

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const totalDays = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const presentCount = markedDates.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18, color: theme.accent, fontWeight: "600" }}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Attendance Report</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Month Nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} disabled={loading}>
           <Image source={require('../assets/icons/back.png')} style={[ { tintColor: theme.text }]} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.text }]}>{monthYear}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} disabled={loading}>
             <Image source={require('../assets/icons/right.png')} style={[ { tintColor: theme.text }]} />
        
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.summaryText, { color: theme.text }]}>
          <Text style={{ fontWeight: "bold" }}>{presentCount}</Text> / {totalDays} days present
        </Text>
      </View>

      {/* Weekdays */}
      <View style={styles.weekdays}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} style={[styles.weekdayText, { color: theme.subText }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar */}
      <View style={styles.calendar}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{ marginTop: 12, color: theme.subText }}>Loading...</Text>
          </View>
        ) : (
          renderCalendar()
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
          <Text style={[styles.legendText, { color: theme.text }]}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderWidth: 2, borderColor: theme.accent }]} />
          <Text style={[styles.legendText, { color: theme.text }]}>Today</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  monthText: { fontSize: 18, fontWeight: "600" },
  summaryCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },
  summaryText: { fontSize: 16 },
  weekdays: {
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  calendar: { paddingHorizontal: 8 },
  weekRow: { flexDirection: "row" },
  dayCell: {
    width: daySize - 4,
    height: daySize - 4,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
    borderRadius: 8,
  },
  dayText: { fontSize: 14 ,color:'green'},
  markedDay: { backgroundColor: "#4CAF50", borderRadius: 8 },
  markedText: { color: "#fff", fontWeight: "bold" },
  todayCell: { borderWidth: 2, borderColor: "#2196F3" },
  todayText: { fontWeight: "bold", color: "white" },
  markDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 6,
  },
  loadingContainer: { alignItems: "center", paddingVertical: 40 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginVertical: 20,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendText: { fontSize: 14 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
});