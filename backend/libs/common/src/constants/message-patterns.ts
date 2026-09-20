/**
 * TCP message pattern constants shared between the API Gateway (client)
 * and the microservices (servers). Grouped by domain.
 */
export const AUTH_PATTERNS = {
  LOGIN: 'auth.login',
  FIND_BY_ID: 'auth.find_by_id',
  // User management (HRD)
  USER_LIST: 'auth.user.list',
  USER_GET: 'auth.user.get',
  USER_CREATE: 'auth.user.create',
  USER_UPDATE: 'auth.user.update',
  USER_DELETE: 'auth.user.delete',
  HEALTH: 'auth.health',
} as const;

export const EMPLOYEE_PATTERNS = {
  // Departments
  DEPARTMENT_LIST: 'employee.department.list',
  DEPARTMENT_GET: 'employee.department.get',
  DEPARTMENT_CREATE: 'employee.department.create',
  DEPARTMENT_UPDATE: 'employee.department.update',
  DEPARTMENT_DELETE: 'employee.department.delete',
  // Positions
  POSITION_LIST: 'employee.position.list',
  POSITION_GET: 'employee.position.get',
  POSITION_LIST_BY_DEPARTMENT: 'employee.position.list_by_department',
  POSITION_CREATE: 'employee.position.create',
  POSITION_UPDATE: 'employee.position.update',
  POSITION_DELETE: 'employee.position.delete',
  // Employees
  EMPLOYEE_LIST: 'employee.employee.list',
  EMPLOYEE_GET: 'employee.employee.get',
  EMPLOYEE_GET_BY_USER: 'employee.employee.get_by_user',
  EMPLOYEE_CREATE: 'employee.employee.create',
  EMPLOYEE_UPDATE: 'employee.employee.update',
  EMPLOYEE_DELETE: 'employee.employee.delete',
  EMPLOYEE_COUNT: 'employee.employee.count',
  EMPLOYEE_USER_IDS: 'employee.employee.user_ids',
  HEALTH: 'employee.health',
} as const;

export const ATTENDANCE_PATTERNS = {
  CHECK_IN: 'attendance.check_in',
  CHECK_OUT: 'attendance.check_out',
  LIST_ME: 'attendance.list_me',
  LIST_ALL: 'attendance.list_all',
  GET: 'attendance.get',
  SUMMARY_TODAY: 'attendance.summary_today',
  MARK_ABSENT: 'attendance.mark_absent',
  HEALTH: 'attendance.health',
} as const;
