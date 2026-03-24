import { Permission, Role } from './permission-definitions';

export class GlobalPermissions {
  static getGlobalPermissions(role: Role): Permission[] {
    // Return all permissions for the role and all roles below it in the hierarchy

    // Define permissions by role - higher roles get all permissions of lower roles
    const rolePermissions: Record<Role, Permission[]> = {
      [Role.ADMIN]: [
        // All permissions for admin
        Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE, Permission.PROJECT_DELETE, Permission.PROJECT_VIEW_ALL, Permission.PROJECT_MANAGE_TEAM, Permission.UNIT_CREATE,Permission.UNIT_UPDATE, Permission.UNIT_READ, Permission.UNIT_UPDATE, Permission.UNIT_DELETE,
        Permission.TEAM_READ, Permission.TEAM_EDIT, Permission.TEAM_DELETE, Permission.TEAM_INVITE, Permission.TEAM_REMOVE, Permission.TEAM_MANAGE_PERMISSIONS, Permission.TEAM_VIEW_ACTIVITY, Permission.USER_MANAGE_ROLES,
        Permission.TIME_TRACKING_READ, Permission.TIME_TRACKING_CREATE, Permission.TIME_TRACKING_UPDATE, Permission.TIME_TRACKING_DELETE, Permission.TIME_TRACKING_APPROVE, Permission.TIME_TRACKING_VIEW_ALL, Permission.TIME_LOG_REPORT_ACCESS, Permission.TIME_TRACKING_BULK_UPLOAD_ALL, Permission.TIME_TRACKING_VIEW_ASSIGNED,
        Permission.FINANCIAL_READ, Permission.FINANCIAL_MANAGE_BUDGET, Permission.FINANCIAL_CREATE_EXPENSE, Permission.FINANCIAL_UPDATE_EXPENSE, Permission.FINANCIAL_DELETE_EXPENSE, Permission.FINANCIAL_APPROVE_EXPENSE, Permission.FINANCIAL_CREATE_INVOICE, Permission.BUDGET_HANDLING,
        Permission.SETTINGS_VIEW, Permission.SETTINGS_UPDATE, Permission.SETTINGS_MANAGE_EMAIL, Permission.SETTINGS_MANAGE_DATABASE, Permission.SETTINGS_MANAGE_SECURITY,
        Permission.REPORTING_VIEW, Permission.REPORTING_CREATE, Permission.REPORTING_UPDATE, Permission.REPORTING_DELETE, Permission.REPORTING_EXPORT,
        Permission.DOCUMENTATION_READ, Permission.DOCUMENTATION_CREATE, Permission.DOCUMENTATION_UPDATE, Permission.DOCUMENTATION_DELETE,Permission.ANNOUNCEMENT_READ, Permission.ANNOUNCEMENT_CREATE, Permission.ANNOUNCEMENT_UPDATE, Permission.ANNOUNCEMENT_DELETE,Permission.ARTICLE_CREATE, Permission.ARTICLE_READ, Permission.ARTICLE_UPDATE, Permission.ARTICLE_DELETE,
        Permission.EPIC_READ, Permission.EPIC_CREATE, Permission.EPIC_UPDATE, Permission.EPIC_DELETE, Permission.EPIC_VIEW_ALL, Permission.EPIC_EDIT, Permission.EPIC_REMOVE,
        Permission.SPRINT_READ, Permission.SPRINT_VIEW, Permission.SPRINT_CREATE, Permission.SPRINT_UPDATE, Permission.SPRINT_DELETE, Permission.SPRINT_MANAGE, Permission.SPRINT_EDIT, Permission.SPRINT_START, Permission.SPRINT_COMPLETE, Permission.SPRINT_VIEW_ALL,
        Permission.SPRINT_EVENT_VIEW, Permission.SPRINT_EVENT_VIEW_ALL,Permission.ANNOUNCEMENT_CREATE, Permission.ANNOUNCEMENT_UPDATE, Permission.ANNOUNCEMENT_DELETE,
        Permission.STORY_READ, Permission.STORY_CREATE, Permission.STORY_UPDATE, Permission.STORY_DELETE, Permission.STORY_VIEW_ALL,
        Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_EDIT_ALL, Permission.TASK_VIEW_ALL, Permission.TASK_DELETE_ALL,
        Permission.CALENDAR_READ, Permission.CALENDAR_CREATE, Permission.CALENDAR_UPDATE, Permission.CALENDAR_DELETE,
        Permission.EVENT_READ, Permission.EVENT_CREATE, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.KANBAN_READ, Permission.KANBAN_MANAGE,
        Permission.BACKLOG_READ, Permission.BACKLOG_MANAGE,
        Permission.TEST_SUITE_READ, Permission.TEST_SUITE_CREATE, Permission.TEST_SUITE_UPDATE, Permission.TEST_SUITE_DELETE,
        Permission.TEST_CASE_READ, Permission.TEST_CASE_CREATE, Permission.TEST_CASE_UPDATE, Permission.TEST_CASE_DELETE,
        Permission.TEST_PLAN_READ, Permission.TEST_PLAN_CREATE, Permission.TEST_PLAN_UPDATE, Permission.TEST_PLAN_DELETE, Permission.TEST_PLAN_MANAGE,
        Permission.TEST_EXECUTION_READ, Permission.TEST_EXECUTION_CREATE, Permission.TEST_EXECUTION_UPDATE, Permission.TEST_EXECUTION_DELETE,
      ],
      [Role.LECTURER]: [
        // Lecturer permissions
        Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE, Permission.PROJECT_DELETE, Permission.PROJECT_VIEW_ALL, Permission.PROJECT_MANAGE_TEAM,
        Permission.TEAM_READ, Permission.TEAM_EDIT, Permission.TEAM_DELETE, Permission.TEAM_INVITE, Permission.TEAM_REMOVE, Permission.TEAM_MANAGE_PERMISSIONS, Permission.TEAM_VIEW_ACTIVITY,
        Permission.TIME_TRACKING_READ, Permission.TIME_TRACKING_CREATE, Permission.TIME_TRACKING_UPDATE, Permission.TIME_TRACKING_DELETE, Permission.TIME_TRACKING_APPROVE, Permission.TIME_TRACKING_VIEW_ALL, Permission.TIME_LOG_REPORT_ACCESS, Permission.TIME_TRACKING_BULK_UPLOAD_ALL,
        Permission.FINANCIAL_READ, Permission.FINANCIAL_MANAGE_BUDGET, Permission.FINANCIAL_CREATE_EXPENSE, Permission.FINANCIAL_UPDATE_EXPENSE, Permission.FINANCIAL_DELETE_EXPENSE, Permission.FINANCIAL_APPROVE_EXPENSE, Permission.FINANCIAL_CREATE_INVOICE,
        Permission.REPORTING_VIEW, Permission.REPORTING_CREATE, Permission.REPORTING_UPDATE, Permission.REPORTING_DELETE, Permission.REPORTING_EXPORT,
        Permission.DOCUMENTATION_READ, Permission.DOCUMENTATION_CREATE, Permission.DOCUMENTATION_UPDATE, Permission.DOCUMENTATION_DELETE,
        Permission.ANNOUNCEMENT_READ, Permission.ANNOUNCEMENT_CREATE, Permission.ANNOUNCEMENT_UPDATE, Permission.ANNOUNCEMENT_DELETE,
        Permission.ARTICLE_CREATE, Permission.ARTICLE_READ, Permission.ARTICLE_UPDATE, Permission.ARTICLE_DELETE,
        Permission.EPIC_READ, Permission.EPIC_CREATE, Permission.EPIC_UPDATE, Permission.EPIC_DELETE, Permission.EPIC_VIEW_ALL, Permission.EPIC_EDIT, Permission.EPIC_REMOVE,
        Permission.SPRINT_READ, Permission.SPRINT_VIEW, Permission.SPRINT_CREATE, Permission.SPRINT_UPDATE, Permission.SPRINT_DELETE, Permission.SPRINT_MANAGE, Permission.SPRINT_EDIT, Permission.SPRINT_START, Permission.SPRINT_COMPLETE, Permission.SPRINT_VIEW_ALL,
        Permission.SPRINT_EVENT_VIEW, Permission.SPRINT_EVENT_VIEW_ALL,
        Permission.STORY_READ, Permission.STORY_CREATE, Permission.STORY_UPDATE, Permission.STORY_DELETE, Permission.STORY_VIEW_ALL,
        Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_EDIT_ALL, Permission.TASK_VIEW_ALL, Permission.TASK_DELETE_ALL,
        Permission.CALENDAR_READ, Permission.CALENDAR_CREATE, Permission.CALENDAR_UPDATE, Permission.CALENDAR_DELETE,
        Permission.EVENT_READ, Permission.EVENT_CREATE, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.KANBAN_READ, Permission.KANBAN_MANAGE,
        Permission.BACKLOG_READ, Permission.BACKLOG_MANAGE,
        Permission.TEST_SUITE_READ, Permission.TEST_SUITE_CREATE, Permission.TEST_SUITE_UPDATE, Permission.TEST_SUITE_DELETE,
        Permission.TEST_CASE_READ, Permission.TEST_CASE_CREATE, Permission.TEST_CASE_UPDATE, Permission.TEST_CASE_DELETE,
        Permission.TEST_PLAN_READ, Permission.TEST_PLAN_CREATE, Permission.TEST_PLAN_UPDATE, Permission.TEST_PLAN_DELETE, Permission.TEST_PLAN_MANAGE,
        Permission.TEST_EXECUTION_READ, Permission.TEST_EXECUTION_CREATE, Permission.TEST_EXECUTION_UPDATE, Permission.TEST_EXECUTION_DELETE,
      ],
      [Role.TEACHER]: [
        // Teacher permissions
        Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE, Permission.PROJECT_VIEW_ALL,
        Permission.TEAM_READ, Permission.TEAM_EDIT, Permission.TEAM_INVITE, Permission.TEAM_REMOVE, Permission.TEAM_VIEW_ACTIVITY,
        Permission.TIME_TRACKING_READ, Permission.TIME_TRACKING_CREATE, Permission.TIME_TRACKING_UPDATE, Permission.TIME_TRACKING_DELETE, Permission.TIME_TRACKING_APPROVE, Permission.TIME_TRACKING_VIEW_ASSIGNED,
        Permission.FINANCIAL_READ, Permission.FINANCIAL_CREATE_EXPENSE, Permission.FINANCIAL_UPDATE_EXPENSE, Permission.FINANCIAL_DELETE_EXPENSE,
        Permission.REPORTING_VIEW, Permission.REPORTING_CREATE, Permission.REPORTING_UPDATE, Permission.REPORTING_DELETE,
        Permission.DOCUMENTATION_READ, Permission.DOCUMENTATION_CREATE, Permission.DOCUMENTATION_UPDATE, Permission.DOCUMENTATION_DELETE,
        Permission.ANNOUNCEMENT_READ, Permission.ANNOUNCEMENT_CREATE, Permission.ANNOUNCEMENT_UPDATE, Permission.ANNOUNCEMENT_DELETE,
        Permission.ARTICLE_CREATE, Permission.ARTICLE_READ, Permission.ARTICLE_UPDATE, Permission.ARTICLE_DELETE,
        Permission.EPIC_READ, Permission.EPIC_CREATE, Permission.EPIC_UPDATE, Permission.EPIC_DELETE, Permission.EPIC_VIEW_ALL,
        Permission.SPRINT_READ, Permission.SPRINT_VIEW, Permission.SPRINT_CREATE, Permission.SPRINT_UPDATE, Permission.SPRINT_DELETE, Permission.SPRINT_MANAGE, Permission.SPRINT_EDIT, Permission.SPRINT_START, Permission.SPRINT_COMPLETE, Permission.SPRINT_VIEW_ALL,
        Permission.SPRINT_EVENT_VIEW, Permission.SPRINT_EVENT_VIEW_ALL,
        Permission.STORY_READ, Permission.STORY_CREATE, Permission.STORY_UPDATE, Permission.STORY_DELETE, Permission.STORY_VIEW_ALL,
        Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_EDIT_ALL, Permission.TASK_VIEW_ALL,
        Permission.CALENDAR_READ, Permission.CALENDAR_CREATE, Permission.CALENDAR_UPDATE, Permission.CALENDAR_DELETE,
        Permission.EVENT_READ, Permission.EVENT_CREATE, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.KANBAN_READ, Permission.KANBAN_MANAGE,
        Permission.BACKLOG_READ, Permission.BACKLOG_MANAGE,
        Permission.TEST_SUITE_READ, Permission.TEST_SUITE_CREATE, Permission.TEST_SUITE_UPDATE, Permission.TEST_SUITE_DELETE,
        Permission.TEST_CASE_READ, Permission.TEST_CASE_CREATE, Permission.TEST_CASE_UPDATE, Permission.TEST_CASE_DELETE,
        Permission.TEST_PLAN_READ, Permission.TEST_PLAN_CREATE, Permission.TEST_PLAN_UPDATE, Permission.TEST_PLAN_DELETE, Permission.TEST_PLAN_MANAGE,
        Permission.TEST_EXECUTION_READ, Permission.TEST_EXECUTION_CREATE, Permission.TEST_EXECUTION_UPDATE, Permission.TEST_EXECUTION_DELETE,
      ],
      [Role.STUDENT]: [
        // Student permissions
        Permission.PROJECT_READ,
        Permission.TEAM_READ, Permission.TEAM_VIEW_ACTIVITY,
        Permission.TIME_TRACKING_READ, Permission.TIME_TRACKING_CREATE, Permission.TIME_TRACKING_UPDATE,
        Permission.DOCUMENTATION_READ,
        Permission.ANNOUNCEMENT_READ,
        Permission.ARTICLE_READ,
        Permission.EPIC_READ, Permission.EPIC_VIEW_ALL,
        Permission.SPRINT_READ, Permission.SPRINT_VIEW, Permission.SPRINT_VIEW_ALL,
        Permission.SPRINT_EVENT_VIEW, Permission.SPRINT_EVENT_VIEW_ALL,
        Permission.STORY_READ, Permission.STORY_VIEW_ALL,
        Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_VIEW_ALL,
        Permission.CALENDAR_READ,
        Permission.EVENT_READ,
        Permission.KANBAN_READ,
        Permission.BACKLOG_READ,
        Permission.TEST_SUITE_READ,
        Permission.TEST_CASE_READ,
        Permission.TEST_PLAN_READ,
        Permission.TEST_EXECUTION_READ,
      ]
    };

    return rolePermissions[role] || [];
  }
}