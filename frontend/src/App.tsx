import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, RoleBasedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import type { NavItem } from './components/layout/Sidebar';

import { LoginPage } from './pages/auth/LoginPage';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeProfile } from './pages/employee/EmployeeProfile';
import { EmployeeAttendance } from './pages/employee/EmployeeAttendance';
import { EmployeeHistory } from './pages/employee/EmployeeHistory';
import { HrdDashboard } from './pages/hrd/HrdDashboard';
import { HrdUsers } from './pages/hrd/HrdUsers';
import { HrdEmployees } from './pages/hrd/HrdEmployees';
import { HrdDepartments } from './pages/hrd/HrdDepartments';
import { HrdPositions } from './pages/hrd/HrdPositions';
import { HrdAttendance } from './pages/hrd/HrdAttendance';

const employeeNav: NavItem[] = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/employee/attendance', label: 'Attendance', icon: '📸' },
  { to: '/employee/history', label: 'History', icon: '🗂️' },
  { to: '/employee/profile', label: 'Profile', icon: '👤' },
];

const hrdNav: NavItem[] = [
  { to: '/hrd/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/hrd/users', label: 'Users', icon: '🔑' },
  { to: '/hrd/employees', label: 'Employees', icon: '👥' },
  { to: '/hrd/departments', label: 'Departments', icon: '🏢' },
  { to: '/hrd/positions', label: 'Positions', icon: '💼' },
  { to: '/hrd/attendance', label: 'Attendance', icon: '🗓️' },
];

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={user.role === 'HRD' ? '/hrd/dashboard' : '/employee/dashboard'}
      replace
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            {/* Employee area */}
            <Route element={<RoleBasedRoute allow="EMPLOYEE" />}>
              <Route element={<DashboardLayout navItems={employeeNav} />}>
                <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                <Route path="/employee/attendance" element={<EmployeeAttendance />} />
                <Route path="/employee/history" element={<EmployeeHistory />} />
                <Route path="/employee/profile" element={<EmployeeProfile />} />
              </Route>
            </Route>

            {/* HRD area */}
            <Route element={<RoleBasedRoute allow="HRD" />}>
              <Route element={<DashboardLayout navItems={hrdNav} />}>
                <Route path="/hrd/dashboard" element={<HrdDashboard />} />
                <Route path="/hrd/users" element={<HrdUsers />} />
                <Route path="/hrd/employees" element={<HrdEmployees />} />
                <Route path="/hrd/departments" element={<HrdDepartments />} />
                <Route path="/hrd/positions" element={<HrdPositions />} />
                <Route path="/hrd/attendance" element={<HrdAttendance />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
