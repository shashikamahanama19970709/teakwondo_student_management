// Simplified Role-Based Access Control for Help Line Academy

export enum Role {
  ADMIN = 'admin',
  LECTURER = 'lecturer',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum PermissionScope {
  GLOBAL = 'global',
  PROJECT = 'project',
  OWN = 'own',
}

export enum PermissionCategory {
  USER = 'user',
  ORGANIZATION = 'organization',
  PROJECT = 'project',
  TASK = 'task',
  STORY = 'story',
  SPRINT = 'sprint',
  EPIC = 'epic',
  CALENDAR = 'calendar',
  TEAM = 'team',
  TIME_TRACKING = 'time_tracking',
  FINANCIAL = 'financial',
  REPORTING = 'reporting',
  SETTINGS = 'settings',
}

export enum ProjectRole {
  PROJECT_MANAGER = 'project_manager',
  PROJECT_MEMBER = 'project_member',
  PROJECT_VIEWER = 'project_viewer',
}

// Legacy Permission enum for backward compatibility with existing API routes
// TODO: Gradually migrate API routes to use Role-based middleware
export enum Permission {
  // Project permissions
  PROJECT_READ = 'project_read',
  PROJECT_CREATE = 'project_create',
  PROJECT_UPDATE = 'project_update',
  PROJECT_DELETE = 'project_delete',
  PROJECT_VIEW_ALL = 'project_view_all',
  PROJECT_MANAGE_TEAM = 'project_manage_team',
  PROJECT_MANAGE_BUDGET = 'project_manage_budget',
  PROJECT_ARCHIVE = 'project_archive',
  PROJECT_RESTORE = 'project_restore',

  // Unit permissions
  UNIT_READ = 'unit_read',
  UNIT_CREATE = 'unit_create',
  UNIT_UPDATE = 'unit_update',
  UNIT_DELETE = 'unit_delete',

  // Team permissions
  TEAM_READ = 'team_read',
  TEAM_EDIT = 'team_edit',
  TEAM_DELETE = 'team_delete',
  TEAM_INVITE = 'team_invite',
  TEAM_REMOVE = 'team_remove',
  TEAM_MANAGE_PERMISSIONS = 'team_manage_permissions',
  TEAM_VIEW_ACTIVITY = 'team_view_activity',
  TEAM_MEMBER_WIDGET_VIEW = 'team_member_widget_view',
  USER_MANAGE_ROLES = 'user_manage_roles',

  // User permissions
  USER_CREATE = 'user_create',
  USER_READ = 'user_read',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_INVITE = 'user_invite',
  USER_ACTIVATE = 'user_activate',
  USER_DEACTIVATE = 'user_deactivate',

  // Organization permissions
  ORGANIZATION_READ = 'organization_read',
  ORGANIZATION_UPDATE = 'organization_update',
  ORGANIZATION_DELETE = 'organization_delete',
  ORGANIZATION_MANAGE_SETTINGS = 'organization_manage_settings',
  ORGANIZATION_MANAGE_BILLING = 'organization_manage_billing',

  // Time tracking permissions
  TIME_TRACKING_READ = 'time_tracking_read',
  TIME_TRACKING_CREATE = 'time_tracking_create',
  TIME_TRACKING_UPDATE = 'time_tracking_update',
  TIME_TRACKING_DELETE = 'time_tracking_delete',
  TIME_TRACKING_APPROVE = 'time_tracking_approve',
  TIME_TRACKING_VIEW_ALL = 'time_tracking_view_all',
  TIME_LOG_REPORT_ACCESS = 'time_log_report_access',
  TIME_TRACKING_BULK_UPLOAD_ALL = 'time_tracking_bulk_upload_all',
  TIME_TRACKING_VIEW_ASSIGNED = 'time_tracking_view_assigned',
  TIME_TRACKING_EXPORT = 'time_tracking_export',
  TIME_TRACKING_EMPLOYEE_FILTER_READ = 'time_tracking_employee_filter_read',

  // Financial permissions
  FINANCIAL_READ = 'financial_read',
  FINANCIAL_MANAGE_BUDGET = 'financial_manage_budget',
  FINANCIAL_CREATE_EXPENSE = 'financial_create_expense',
  FINANCIAL_UPDATE_EXPENSE = 'financial_update_expense',
  FINANCIAL_DELETE_EXPENSE = 'financial_delete_expense',
  FINANCIAL_APPROVE_EXPENSE = 'financial_approve_expense',
  FINANCIAL_CREATE_INVOICE = 'financial_create_invoice',
  FINANCIAL_SEND_INVOICE = 'financial_send_invoice',
  FINANCIAL_MANAGE_PAYMENTS = 'financial_manage_payments',
  BUDGET_HANDLING = 'budget_handling',

  // Settings permissions
  SETTINGS_VIEW = 'settings_view',
  SETTINGS_UPDATE = 'settings_update',
  SETTINGS_MANAGE_EMAIL = 'settings_manage_email',
  SETTINGS_MANAGE_DATABASE = 'settings_manage_database',
  SETTINGS_MANAGE_SECURITY = 'settings_manage_security',

  // Reporting permissions
  REPORTING_VIEW = 'reporting_view',
  REPORTING_CREATE = 'reporting_create',
  REPORTING_UPDATE = 'reporting_update',
  REPORTING_DELETE = 'reporting_delete',
  REPORTING_EXPORT = 'reporting_export',
  REPORTING_SHARE = 'reporting_share',

  // Security permissions
  SECURITY_READ = 'security_read',
  SECURITY_UPDATE = 'security_update',

  // Roadmap permissions
  ROADMAP_READ = 'roadmap_read',
  ROADMAP_CREATE = 'roadmap_create',
  ROADMAP_UPDATE = 'roadmap_update',
  ROADMAP_DELETE = 'roadmap_delete',

  // Documentation permissions
  DOCUMENTATION_READ = 'documentation_read',
  DOCUMENTATION_CREATE = 'documentation_create',
  DOCUMENTATION_UPDATE = 'documentation_update',
  DOCUMENTATION_DELETE = 'documentation_delete',

  // Epic permissions
  EPIC_READ = 'epic_read',
  EPIC_CREATE = 'epic_create',
  EPIC_UPDATE = 'epic_update',
  EPIC_DELETE = 'epic_delete',
  EPIC_VIEW_ALL = 'epic_view_all',
  EPIC_EDIT = 'epic_edit',
  EPIC_REMOVE = 'epic_remove',
  EPIC_VIEW = 'epic_view',

  // Sprint permissions
  SPRINT_READ = 'sprint_read',
  SPRINT_VIEW = 'sprint_view',
  SPRINT_CREATE = 'sprint_create',
  SPRINT_UPDATE = 'sprint_update',
  SPRINT_DELETE = 'sprint_delete',
  SPRINT_MANAGE = 'sprint_manage',
  SPRINT_EDIT = 'sprint_edit',
  SPRINT_START = 'sprint_start',
  SPRINT_COMPLETE = 'sprint_complete',
  SPRINT_VIEW_ALL = 'sprint_view_all',

  // Sprint event permissions
  SPRINT_EVENT_VIEW = 'sprint_event_view',
  SPRINT_EVENT_VIEW_ALL = 'sprint_event_view_all',

  // Subject permissions
  SUBJECT_READ = 'subject_read',
  SUBJECT_CREATE = 'subject_create',
  SUBJECT_UPDATE = 'subject_update',
  SUBJECT_DELETE = 'subject_delete',

  // Story permissions
  STORY_READ = 'story_read',
  STORY_CREATE = 'story_create',
  STORY_UPDATE = 'story_update',
  STORY_DELETE = 'story_delete',
  STORY_VIEW_ALL = 'story_view_all',
  STORY_MANAGE_ALL = 'story_manage_all',

  // Task permissions
  TASK_READ = 'task_read',
  TASK_CREATE = 'task_create',
  TASK_UPDATE = 'task_update',
  TASK_DELETE = 'task_delete',
  TASK_ASSIGN = 'task_assign',
  TASK_CHANGE_STATUS = 'task_change_status',
  TASK_MANAGE_COMMENTS = 'task_manage_comments',
  TASK_MANAGE_ATTACHMENTS = 'task_manage_attachments',
  TASK_EDIT_ALL = 'task_edit_all',
  TASK_VIEW_ALL = 'task_view_all',
  TASK_DELETE_ALL = 'task_delete_all',

  // Calendar permissions
  CALENDAR_READ = 'calendar_read',
  CALENDAR_CREATE = 'calendar_create',
  CALENDAR_UPDATE = 'calendar_update',
  CALENDAR_DELETE = 'calendar_delete',

  // Event permissions
  EVENT_READ = 'event_read',
  EVENT_CREATE = 'event_create',
  EVENT_UPDATE = 'event_update',
  EVENT_DELETE = 'event_delete',

  // Notification permissions
  NOTIFICATION_READ = 'notification_read',
  NOTIFICATION_CREATE = 'notification_create',
  NOTIFICATION_UPDATE = 'notification_update',
  NOTIFICATION_DELETE = 'notification_delete',

  // Kanban permissions
  KANBAN_READ = 'kanban_read',
  KANBAN_MANAGE = 'kanban_manage',

  // Backlog permissions
  BACKLOG_READ = 'backlog_read',
  BACKLOG_MANAGE = 'backlog_manage',

  // Test management permissions
  TEST_SUITE_READ = 'test_suite_read',
  TEST_SUITE_CREATE = 'test_suite_create',
  TEST_SUITE_UPDATE = 'test_suite_update',
  TEST_SUITE_DELETE = 'test_suite_delete',
  TEST_CASE_READ = 'test_case_read',
  TEST_CASE_CREATE = 'test_case_create',
  TEST_CASE_UPDATE = 'test_case_update',
  TEST_CASE_DELETE = 'test_case_delete',
  TEST_PLAN_READ = 'test_plan_read',
  TEST_PLAN_CREATE = 'test_plan_create',
  TEST_PLAN_UPDATE = 'test_plan_update',
  TEST_PLAN_DELETE = 'test_plan_delete',
  TEST_PLAN_MANAGE = 'test_plan_manage',
  TEST_EXECUTION_READ = 'test_execution_read',
  TEST_EXECUTION_CREATE = 'test_execution_create',
  TEST_EXECUTION_UPDATE = 'test_execution_update',
  TEST_EXECUTION_DELETE = 'test_execution_delete',
  TEST_REPORT_VIEW = 'test_report_view',
  TEST_REPORT_EXPORT = 'test_report_export',
  TEST_MANAGE = 'test_manage',

  // Certification permissions
  CERTIFICATION_READ = 'certification_read',
  CERTIFICATION_CREATE = 'certification_create',
  CERTIFICATION_UPDATE = 'certification_update',
  CERTIFICATION_DELETE = 'certification_delete',
  CERTIFICATION_VIEW_ALL = 'certification_view_all',

  // Announcement permissions
  ANNOUNCEMENT_READ = 'announcement_read',
  ANNOUNCEMENT_CREATE = 'announcement_create',
  ANNOUNCEMENT_UPDATE = 'announcement_update',
  ANNOUNCEMENT_DELETE = 'announcement_delete',

  // Article permissions
  ARTICLE_READ = 'article_read',
  ARTICLE_CREATE = 'article_create',
  ARTICLE_UPDATE = 'article_update',
  ARTICLE_DELETE = 'article_delete',

  // Verification permissions
  VERIFY_EMAIL = 'verify_email',
  VERIFY_OTP = 'verify_otp',

  // Profile permissions
  PROFILE_READ = 'profile_read',
  PROFILE_UPDATE = 'profile_update',

 
}

// Simple role hierarchy for easy checking
export const ROLE_HIERARCHY = {
  [Role.ADMIN]: 4,
  [Role.LECTURER]: 3,
  [Role.TEACHER]: 2,
  [Role.STUDENT]: 1,
} as const;

// Helper functions for role checking
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canCreate(userRole: Role): boolean {
  return hasRole(userRole, Role.TEACHER); // ADMIN, LECTURER, TEACHER can create
}

export function canEdit(userRole: Role): boolean {
  return hasRole(userRole, Role.TEACHER); // ADMIN, LECTURER, TEACHER can edit
}

export function canDelete(userRole: Role): boolean {
  return hasRole(userRole, Role.TEACHER); // ADMIN, LECTURER, TEACHER can delete
}

export function canViewAll(userRole: Role): boolean {
  return hasRole(userRole, Role.TEACHER); // ADMIN, LECTURER, TEACHER can view all
}

// Helper function to determine permission scope
export function getPermissionScope(permission: Permission): PermissionScope {
  // Global permissions - affect entire organization
  const globalPermissions = [
    Permission.USER_DELETE,
    Permission.USER_ACTIVATE,
    Permission.USER_DEACTIVATE,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_UPDATE,
    Permission.PROJECT_VIEW_ALL,
    Permission.TIME_TRACKING_VIEW_ALL,
    Permission.TIME_TRACKING_APPROVE,
    Permission.TIME_TRACKING_BULK_UPLOAD_ALL,
    Permission.TIME_LOG_REPORT_ACCESS,
    Permission.FINANCIAL_APPROVE_EXPENSE,
    Permission.FINANCIAL_MANAGE_BUDGET,
    Permission.BUDGET_HANDLING,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.SETTINGS_MANAGE_EMAIL,
    Permission.SETTINGS_MANAGE_DATABASE,
    Permission.SETTINGS_MANAGE_SECURITY,
    Permission.REPORTING_EXPORT,
    Permission.EPIC_VIEW_ALL,
    Permission.SPRINT_VIEW_ALL,
    Permission.SPRINT_EVENT_VIEW_ALL,
    Permission.STORY_VIEW_ALL,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_EDIT_ALL,
    Permission.TASK_DELETE_ALL,
    Permission.CERTIFICATION_VIEW_ALL,
    Permission.USER_MANAGE_ROLES,
  ];

  // Project-scoped permissions - affect specific projects
  const projectPermissions = [
    Permission.PROJECT_READ,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE_TEAM,
    Permission.TEAM_READ,
    Permission.TEAM_EDIT,
    Permission.TEAM_DELETE,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE,
    Permission.TEAM_MANAGE_PERMISSIONS,
    Permission.TEAM_VIEW_ACTIVITY,
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.EPIC_READ,
    Permission.EPIC_CREATE,
    Permission.EPIC_UPDATE,
    Permission.EPIC_DELETE,
    Permission.EPIC_EDIT,
    Permission.EPIC_REMOVE,
    Permission.SPRINT_READ,
    Permission.SPRINT_VIEW,
    Permission.SPRINT_CREATE,
    Permission.SPRINT_UPDATE,
    Permission.SPRINT_DELETE,
    Permission.SPRINT_MANAGE,
    Permission.SPRINT_EDIT,
    Permission.SPRINT_START,
    Permission.SPRINT_COMPLETE,
    Permission.SPRINT_EVENT_VIEW,
    Permission.STORY_READ,
    Permission.STORY_CREATE,
    Permission.STORY_UPDATE,
    Permission.STORY_DELETE,
    Permission.KANBAN_READ,
    Permission.KANBAN_MANAGE,
    Permission.BACKLOG_READ,
    Permission.BACKLOG_MANAGE,
    Permission.TEST_SUITE_READ,
    Permission.TEST_SUITE_CREATE,
    Permission.TEST_SUITE_UPDATE,
    Permission.TEST_SUITE_DELETE,
    Permission.TEST_CASE_READ,
    Permission.TEST_CASE_CREATE,
    Permission.TEST_CASE_UPDATE,
    Permission.TEST_CASE_DELETE,
    Permission.TEST_PLAN_READ,
    Permission.TEST_PLAN_CREATE,
    Permission.TEST_PLAN_UPDATE,
    Permission.TEST_PLAN_DELETE,
    Permission.TEST_PLAN_MANAGE,
    Permission.TEST_EXECUTION_READ,
    Permission.TEST_EXECUTION_CREATE,
    Permission.TEST_EXECUTION_UPDATE,
    Permission.TEST_EXECUTION_DELETE,
    Permission.TEST_REPORT_VIEW,
    Permission.TEST_REPORT_EXPORT,
    Permission.TEST_MANAGE,
    Permission.CALENDAR_READ,
    Permission.CALENDAR_CREATE,
    Permission.CALENDAR_UPDATE,
    Permission.CALENDAR_DELETE,
    Permission.EVENT_READ,
    Permission.EVENT_CREATE,
    Permission.EVENT_UPDATE,
    Permission.EVENT_DELETE,
    Permission.FINANCIAL_READ,
    Permission.FINANCIAL_CREATE_EXPENSE,
    Permission.FINANCIAL_UPDATE_EXPENSE,
    Permission.FINANCIAL_DELETE_EXPENSE,
    Permission.FINANCIAL_CREATE_INVOICE,
    Permission.REPORTING_VIEW,
    Permission.REPORTING_CREATE,
    Permission.REPORTING_UPDATE,
    Permission.REPORTING_DELETE,
    Permission.DOCUMENTATION_READ,
    Permission.DOCUMENTATION_CREATE,
    Permission.DOCUMENTATION_UPDATE,
    Permission.DOCUMENTATION_DELETE,
    Permission.UNIT_READ,
    Permission.UNIT_CREATE,
    Permission.UNIT_UPDATE,
    Permission.UNIT_DELETE,
    Permission.CERTIFICATION_READ,
    Permission.CERTIFICATION_CREATE,
    Permission.CERTIFICATION_UPDATE,
    Permission.CERTIFICATION_DELETE,
    Permission.ANNOUNCEMENT_READ,
    Permission.ANNOUNCEMENT_CREATE,
    Permission.ANNOUNCEMENT_UPDATE,
    Permission.ANNOUNCEMENT_DELETE,
    Permission.ARTICLE_READ,
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_UPDATE,
    Permission.ARTICLE_DELETE,
    Permission.SUBJECT_READ,
    Permission.SUBJECT_CREATE,
    Permission.SUBJECT_UPDATE,
    Permission.SUBJECT_DELETE,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_CREATE,
    Permission.NOTIFICATION_UPDATE,
    Permission.NOTIFICATION_DELETE,
    Permission.ROADMAP_READ,
    Permission.ROADMAP_CREATE,
    Permission.ROADMAP_UPDATE,
    Permission.ROADMAP_DELETE,
    Permission.SECURITY_READ,
    Permission.SECURITY_UPDATE,
  ];

  // Own permissions - affect only the user's own resources
  const ownPermissions = [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_INVITE,
    Permission.USER_CREATE,
    Permission.TIME_TRACKING_READ,
    Permission.TIME_TRACKING_CREATE,
    Permission.TIME_TRACKING_UPDATE,
    Permission.TIME_TRACKING_DELETE,
    Permission.TIME_TRACKING_VIEW_ASSIGNED,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.VERIFY_EMAIL,
    Permission.VERIFY_OTP,
    Permission.TEAM_MEMBER_WIDGET_VIEW,
  ];

  if (globalPermissions.includes(permission)) {
    return PermissionScope.GLOBAL;
  } else if (projectPermissions.includes(permission)) {
    return PermissionScope.PROJECT;
  } else if (ownPermissions.includes(permission)) {
    return PermissionScope.OWN;
  }

  // Default to project scope for unknown permissions
  return PermissionScope.PROJECT;
}

// Project role permissions for backward compatibility
export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  [ProjectRole.PROJECT_MANAGER]: [
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_MANAGE_TEAM,
    Permission.PROJECT_MANAGE_BUDGET,
    Permission.PROJECT_ARCHIVE,
    Permission.PROJECT_RESTORE,
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TASK_CHANGE_STATUS,
    Permission.TASK_MANAGE_COMMENTS,
    Permission.TASK_MANAGE_ATTACHMENTS,
  ],
  [ProjectRole.PROJECT_MEMBER]: [
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
    Permission.TASK_CHANGE_STATUS,
    Permission.TASK_MANAGE_COMMENTS,
    Permission.TASK_MANAGE_ATTACHMENTS,
  ],
  [ProjectRole.PROJECT_VIEWER]: [
    Permission.PROJECT_READ,
    Permission.TASK_READ,
  ],
};
