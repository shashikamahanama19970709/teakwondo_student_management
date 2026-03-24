import { Permission, Role, PermissionScope, getPermissionScope } from './permission-definitions';
import { GlobalPermissions } from './global-permissions';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { CustomRole } from '@/models/CustomRole';
import mongoose from 'mongoose';
import { permission } from 'process';

export interface UserPermissions {
  globalPermissions: Permission[];
  projectPermissions: Map<string, Permission[]>; // projectId -> permissions
  userRole: Role;
  customRole?: {
    _id: string;
    name: string;
    permissions: Permission[];
  };
}

export class PermissionService {
  static async getUserPermissions(userId: string): Promise<UserPermissions> {
    const { getOrganizationId } = await import('@/lib/server-config');
    const user = await User.findById(userId).populate('customRole');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get global permissions based on user role and custom role
    let globalPermissions = GlobalPermissions.getGlobalPermissions(user.role as Role);
    
    // If user has a custom role, merge those permissions
    if (user.customRole) {
      const customRole = user.customRole as any;
      globalPermissions = Array.from(new Set([...globalPermissions, ...customRole.permissions]));
    }
    
    // Get project-specific permissions (same as global for now, but filtered by accessible projects)
    const projectPermissions = new Map<string, Permission[]>();
    
    // Find all projects where user is a team member (based on role)
    let projects = [];
    
    if (user.role === Role.ADMIN || user.role === Role.LECTURER) {
      // Admins and lecturers can access all projects
      projects = await Project.find({ 
        organization: getOrganizationId(),
        is_deleted: { $ne: true }
      });
    } else if (user.role === Role.TEACHER) {
      // Teachers can access projects they're assigned to
      projects = await Project.find({
        organization: getOrganizationId(),
        is_deleted: { $ne: true },
        $or: [
          { teamMembers: user._id },
          { createdBy: user._id },
          { client: user._id }
        ]
      });
    } else if (user.role === Role.STUDENT) {
      // Students can access projects they're enrolled in (as team members or via enrolledCourses)
      const enrolledCourseIds = user.enrolledCourses?.map((ec: any) => ec.courseId) || [];
      
      projects = await Project.find({
        organization: getOrganizationId(),
        is_deleted: { $ne: true },
        $or: [
          { teamMembers: user._id },
          { _id: { $in: enrolledCourseIds } }
        ]
      });
    }

    // Set project permissions (same as global permissions for accessible projects)
    for (const project of projects) {
      projectPermissions.set(project._id.toString(), globalPermissions);
    }

    return {
      globalPermissions,
      projectPermissions,
      userRole: user.role as Role,
      customRole: user.customRole ? {
        _id: (user.customRole as any)._id.toString(),
        name: (user.customRole as any).name,
        permissions: (user.customRole as any).permissions
      } : undefined
    };
  }

  static async hasPermission(
    userId: string, 
    permission: Permission, 
    projectId?: string
  ): Promise<boolean> {
    const { getOrganizationId } = await import('@/lib/server-config');
    const userPermissions = await this.getUserPermissions(userId);
    const scope = getPermissionScope(permission);
    
    switch (scope) {
      case PermissionScope.GLOBAL:
        return userPermissions.globalPermissions.includes(permission);
        
      case PermissionScope.PROJECT:
        if (!projectId) {
          // For project-scoped permissions, we need a project context
          return false;
        }
        
        // First check if user has the permission globally (e.g., ADMIN role)
        if (userPermissions.globalPermissions.includes(permission)) {
          // If they have it globally, verify the project belongs to their organization
          const user = await User.findById(userId);
          if (user) {
            const project = await Project.findById(projectId);
            if (project && getOrganizationId().toString() === project.organization.toString()) {
              return true;
            }
          }
        }
        
        // Check project-specific permissions
        const projectPermissions = userPermissions.projectPermissions.get(projectId);
        return projectPermissions ? projectPermissions.includes(permission) : false;
        
      case PermissionScope.OWN:
        // For own permissions, user always has access to their own resources
        return true;
        
      default:
        return false;
    }
  }

  static async hasAnyPermission(
    userId: string, 
    permissions: Permission[], 
    projectId?: string
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, projectId)) {
        return true;
      }
    }
    return false;
  }

  static async hasAllPermissions(
    userId: string, 
    permissions: Permission[], 
    projectId?: string
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission, projectId))) {
        return false;
      }
    }
    return true;
  }

  static async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    const { getOrganizationId } = await import('@/lib/server-config');
    const userPermissions = await this.getUserPermissions(userId);
    
    // Check if user has PROJECT_VIEW_ALL permission (allows viewing all projects)
    if (userPermissions.globalPermissions.includes(Permission.PROJECT_VIEW_ALL)) {
      // Verify the project belongs to the user's organization
      const user = await User.findById(userId);
      if (user) {
        const project = await Project.findById(projectId);
        if (project && getOrganizationId().toString() === project.organization.toString()) {
          return true;
        }
      }
    }
    
    // Admin can access all projects
    if (userPermissions.userRole === Role.ADMIN) {
      return true;
    }
    
    // Check if user has access to this specific project
    return userPermissions.projectPermissions.has(projectId);
  }

  static async canManageProject(userId: string, projectId: string): Promise<boolean> {
    return this.hasPermission(userId, Permission.PROJECT_UPDATE, projectId);
  }

  static async getAccessibleProjects(userId: string): Promise<string[]> {
    const { getOrganizationId } = await import('@/lib/server-config');
    const userPermissions = await this.getUserPermissions(userId);
    
    // Check if user has PROJECT_VIEW_ALL permission (allows viewing all projects)
    if (userPermissions.globalPermissions.includes(Permission.PROJECT_VIEW_ALL)) {
      const user = await User.findById(userId);
      if (user) {
        const allProjects = await Project.find({ 
          organization: getOrganizationId(),
          is_deleted: { $ne: true }
        }).select('_id');
        return allProjects.map(p => p._id.toString());
      }
    }
    
    // Admin can access all projects
    if (userPermissions.userRole === Role.ADMIN) {
      const user = await User.findById(userId);
      if (user) {
        const allProjects = await Project.find({ 
          organization: getOrganizationId(),
          is_deleted: { $ne: true }
        }).select('_id');
        return allProjects.map(p => p._id.toString());
      }
    }
    
    // Return projects where user has access
    return Array.from(userPermissions.projectPermissions.keys());
  }

  static async filterProjectsByAccess(userId: string, projectIds: string[]): Promise<string[]> {
    const accessibleProjects = await this.getAccessibleProjects(userId);
    return projectIds.filter(id => accessibleProjects.includes(id));
  }

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
        Permission.TEST_REPORT_VIEW, Permission.TEST_REPORT_EXPORT, Permission.TEST_MANAGE,
        Permission.CERTIFICATION_READ, Permission.CERTIFICATION_CREATE, Permission.CERTIFICATION_UPDATE, Permission.CERTIFICATION_DELETE, Permission.CERTIFICATION_VIEW_ALL,
        Permission.ANNOUNCEMENT_READ, Permission.ANNOUNCEMENT_CREATE, Permission.ANNOUNCEMENT_UPDATE, Permission.ANNOUNCEMENT_DELETE,
        Permission.ARTICLE_READ, Permission.ARTICLE_CREATE, Permission.ARTICLE_UPDATE, Permission.ARTICLE_DELETE,
        
        
        Permission.SUBJECT_READ, Permission.SUBJECT_CREATE, Permission.SUBJECT_UPDATE, Permission.SUBJECT_DELETE,
        Permission.NOTIFICATION_READ, Permission.NOTIFICATION_CREATE, Permission.NOTIFICATION_UPDATE, Permission.NOTIFICATION_DELETE,
        Permission.PROFILE_READ, Permission.PROFILE_UPDATE,
        Permission.ROADMAP_READ, Permission.ROADMAP_CREATE, Permission.ROADMAP_UPDATE, Permission.ROADMAP_DELETE,
        Permission.SECURITY_READ, Permission.SECURITY_UPDATE,
        
        Permission.VERIFY_EMAIL, Permission.VERIFY_OTP,
        Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE, Permission.USER_INVITE, Permission.USER_ACTIVATE, Permission.USER_DEACTIVATE,
        Permission.ORGANIZATION_READ, Permission.ORGANIZATION_UPDATE,
      ],
      [Role.LECTURER]: [
        // Lecturer permissions (most admin permissions except user management and some settings)
        Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE, Permission.PROJECT_DELETE, Permission.PROJECT_VIEW_ALL, Permission.PROJECT_MANAGE_TEAM,
        Permission.UNIT_READ, Permission.UNIT_CREATE, Permission.UNIT_UPDATE, Permission.UNIT_DELETE,
        Permission.TEAM_READ, Permission.TEAM_EDIT, Permission.TEAM_INVITE, Permission.TEAM_REMOVE, Permission.TEAM_VIEW_ACTIVITY,
        Permission.TIME_TRACKING_READ, Permission.TIME_TRACKING_CREATE, Permission.TIME_TRACKING_UPDATE, Permission.TIME_TRACKING_DELETE, Permission.TIME_TRACKING_APPROVE, Permission.TIME_TRACKING_VIEW_ALL, Permission.TIME_LOG_REPORT_ACCESS, Permission.TIME_TRACKING_BULK_UPLOAD_ALL, Permission.TIME_TRACKING_VIEW_ASSIGNED,
        Permission.FINANCIAL_READ, Permission.FINANCIAL_MANAGE_BUDGET, Permission.FINANCIAL_CREATE_EXPENSE, Permission.FINANCIAL_UPDATE_EXPENSE, Permission.FINANCIAL_DELETE_EXPENSE, Permission.FINANCIAL_APPROVE_EXPENSE, Permission.FINANCIAL_CREATE_INVOICE,
        Permission.REPORTING_VIEW, Permission.REPORTING_CREATE, Permission.REPORTING_UPDATE, Permission.REPORTING_DELETE, Permission.REPORTING_EXPORT,
        Permission.EPIC_READ, Permission.EPIC_CREATE, Permission.EPIC_UPDATE, Permission.EPIC_DELETE, Permission.EPIC_VIEW_ALL, Permission.EPIC_EDIT, Permission.EPIC_REMOVE,
        Permission.SPRINT_READ, Permission.SPRINT_VIEW, Permission.SPRINT_CREATE, Permission.SPRINT_UPDATE, Permission.SPRINT_DELETE, Permission.SPRINT_MANAGE, Permission.SPRINT_EDIT, Permission.SPRINT_START, Permission.SPRINT_COMPLETE, Permission.SPRINT_VIEW_ALL,
        Permission.SPRINT_EVENT_VIEW, Permission.SPRINT_EVENT_VIEW_ALL,
        Permission.STORY_READ, Permission.STORY_CREATE, Permission.STORY_UPDATE, Permission.STORY_DELETE,
        Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_EDIT_ALL, Permission.TASK_VIEW_ALL, Permission.TASK_DELETE_ALL,
        Permission.CALENDAR_READ, Permission.CALENDAR_CREATE, Permission.CALENDAR_UPDATE, Permission.CALENDAR_DELETE,
        Permission.EVENT_READ, Permission.EVENT_CREATE, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.KANBAN_READ, Permission.KANBAN_MANAGE,
        Permission.BACKLOG_READ, Permission.BACKLOG_MANAGE,
        Permission.TEST_SUITE_READ, Permission.TEST_SUITE_CREATE, Permission.TEST_SUITE_UPDATE, Permission.TEST_SUITE_DELETE,
        Permission.TEST_CASE_READ, Permission.TEST_CASE_CREATE, Permission.TEST_CASE_UPDATE, Permission.TEST_CASE_DELETE,
        Permission.TEST_PLAN_READ, Permission.TEST_PLAN_CREATE, Permission.TEST_PLAN_UPDATE, Permission.TEST_PLAN_DELETE, Permission.TEST_PLAN_MANAGE,
        Permission.TEST_EXECUTION_READ, Permission.TEST_EXECUTION_CREATE, Permission.TEST_EXECUTION_UPDATE, Permission.TEST_EXECUTION_DELETE,
        Permission.TEST_REPORT_VIEW, Permission.TEST_REPORT_EXPORT, Permission.TEST_MANAGE,
        Permission.CERTIFICATION_READ, Permission.CERTIFICATION_CREATE, Permission.CERTIFICATION_UPDATE, Permission.CERTIFICATION_DELETE, Permission.CERTIFICATION_VIEW_ALL,
        Permission.ANNOUNCEMENT_READ, Permission.ANNOUNCEMENT_CREATE, Permission.ANNOUNCEMENT_UPDATE, Permission.ANNOUNCEMENT_DELETE,
        Permission.ARTICLE_READ, Permission.ARTICLE_CREATE, Permission.ARTICLE_UPDATE, Permission.ARTICLE_DELETE,
        
        
        Permission.SUBJECT_READ, Permission.SUBJECT_CREATE, Permission.SUBJECT_UPDATE, Permission.SUBJECT_DELETE,
        Permission.NOTIFICATION_READ, Permission.NOTIFICATION_CREATE, Permission.NOTIFICATION_UPDATE, Permission.NOTIFICATION_DELETE,
        Permission.PROFILE_READ, Permission.PROFILE_UPDATE,
        Permission.ROADMAP_READ, Permission.ROADMAP_CREATE, Permission.ROADMAP_UPDATE, Permission.ROADMAP_DELETE,
        Permission.SECURITY_READ, Permission.SECURITY_UPDATE,
        
        Permission.VERIFY_EMAIL, Permission.VERIFY_OTP,
        Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_INVITE,
      ],
      [Role.TEACHER]: [
        // Teacher permissions (teaching and content creation focused)
        Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE,
        Permission.UNIT_READ, Permission.UNIT_CREATE, Permission.UNIT_UPDATE, Permission.UNIT_DELETE,
        Permission.TEAM_READ, Permission.TEAM_EDIT, Permission.TEAM_INVITE, Permission.TEAM_VIEW_ACTIVITY, Permission.TEAM_MEMBER_WIDGET_VIEW,
        Permission.TIME_TRACKING_READ, Permission.TIME_TRACKING_CREATE, Permission.TIME_TRACKING_UPDATE, Permission.TIME_TRACKING_DELETE, Permission.TIME_TRACKING_VIEW_ASSIGNED,
        Permission.FINANCIAL_READ, Permission.FINANCIAL_CREATE_EXPENSE, Permission.FINANCIAL_UPDATE_EXPENSE,
        Permission.REPORTING_VIEW, Permission.REPORTING_CREATE, Permission.REPORTING_UPDATE,
        Permission.EPIC_READ, Permission.EPIC_CREATE, Permission.EPIC_UPDATE, Permission.EPIC_DELETE, Permission.EPIC_EDIT,
        Permission.SPRINT_READ, Permission.SPRINT_VIEW, Permission.SPRINT_CREATE, Permission.SPRINT_UPDATE, Permission.SPRINT_EDIT,
        Permission.SPRINT_EVENT_VIEW,
        Permission.STORY_READ, Permission.STORY_CREATE, Permission.STORY_UPDATE, Permission.STORY_DELETE, Permission.TASK_CREATE, Permission.TASK_EDIT_ALL, Permission.TASK_VIEW_ALL, Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.CALENDAR_READ, Permission.CALENDAR_CREATE, Permission.CALENDAR_UPDATE, Permission.CALENDAR_DELETE,
        Permission.EVENT_READ, Permission.EVENT_CREATE, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.KANBAN_READ, Permission.KANBAN_MANAGE,
        Permission.BACKLOG_READ, Permission.BACKLOG_MANAGE,
        Permission.TEST_SUITE_READ, Permission.TEST_SUITE_CREATE, Permission.TEST_SUITE_UPDATE, Permission.TEST_SUITE_DELETE,
        Permission.TEST_CASE_READ, Permission.TEST_CASE_CREATE, Permission.TEST_CASE_UPDATE, Permission.TEST_CASE_DELETE,
        Permission.TEST_PLAN_READ, Permission.TEST_PLAN_CREATE, Permission.TEST_PLAN_UPDATE, Permission.TEST_PLAN_DELETE,
        Permission.TEST_EXECUTION_READ, Permission.TEST_EXECUTION_CREATE, Permission.TEST_EXECUTION_UPDATE, Permission.TEST_EXECUTION_DELETE,
        Permission.TEST_REPORT_VIEW, Permission.TEST_REPORT_EXPORT,
        Permission.CERTIFICATION_READ, Permission.CERTIFICATION_CREATE, Permission.CERTIFICATION_UPDATE, Permission.CERTIFICATION_DELETE,
        Permission.ANNOUNCEMENT_READ, Permission.ANNOUNCEMENT_CREATE, Permission.ANNOUNCEMENT_UPDATE, Permission.ANNOUNCEMENT_DELETE,
        Permission.ARTICLE_READ, Permission.ARTICLE_CREATE, Permission.ARTICLE_UPDATE, Permission.ARTICLE_DELETE,
        
        
        Permission.SUBJECT_READ, Permission.SUBJECT_CREATE, Permission.SUBJECT_UPDATE, Permission.SUBJECT_DELETE,
        Permission.NOTIFICATION_READ, Permission.NOTIFICATION_CREATE, Permission.NOTIFICATION_UPDATE, Permission.NOTIFICATION_DELETE,
        Permission.PROFILE_READ, Permission.PROFILE_UPDATE,
        Permission.ROADMAP_READ, Permission.ROADMAP_CREATE, Permission.ROADMAP_UPDATE, Permission.ROADMAP_DELETE,
        Permission.SECURITY_READ,
        
        Permission.VERIFY_EMAIL, Permission.VERIFY_OTP,
        Permission.USER_READ,
      ],
      [Role.STUDENT]: [
        // Student permissions (read-only and limited creation)
        Permission.PROJECT_READ,
        Permission.UNIT_READ,
        Permission.TEAM_READ, Permission.TEAM_VIEW_ACTIVITY, Permission.TEAM_MEMBER_WIDGET_VIEW,
        Permission.TIME_TRACKING_READ, Permission.TIME_TRACKING_CREATE, Permission.TIME_TRACKING_UPDATE,
        Permission.FINANCIAL_READ,
        Permission.REPORTING_VIEW,
        Permission.EPIC_READ,
        Permission.SPRINT_READ, Permission.SPRINT_VIEW,
        Permission.SPRINT_EVENT_VIEW,
        Permission.STORY_READ, Permission.STORY_CREATE, Permission.STORY_UPDATE,
        Permission.TASK_READ,
        Permission.CALENDAR_READ,
        Permission.EVENT_READ,
        Permission.KANBAN_READ,
        Permission.BACKLOG_READ,
        Permission.TEST_SUITE_READ,
        Permission.TEST_CASE_READ,
        Permission.TEST_PLAN_READ,
        Permission.TEST_EXECUTION_READ, Permission.TEST_EXECUTION_CREATE, Permission.TEST_EXECUTION_UPDATE,
        Permission.TEST_REPORT_VIEW,
        Permission.CERTIFICATION_READ,
        Permission.ANNOUNCEMENT_READ,
       
        Permission.ARTICLE_READ,
        Permission.SUBJECT_READ,
        Permission.NOTIFICATION_READ,
        Permission.PROFILE_READ,
        Permission.ROADMAP_READ,
        Permission.SECURITY_READ,
        Permission.VERIFY_EMAIL, Permission.VERIFY_OTP,
        Permission.USER_READ,
      ],
    };

    return rolePermissions[role] || [];
  }





  static async requirePermission(
    userId: string, 
    permission: Permission, 
    projectId?: string
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, permission, projectId);
    
    if (!hasPermission) {
      throw new Error(`Insufficient permissions: ${permission}`);
    }
  }

  static async requireAnyPermission(
    userId: string, 
    permissions: Permission[], 
    projectId?: string
  ): Promise<void> {
    const hasAnyPermission = await this.hasAnyPermission(userId, permissions, projectId);
    
    if (!hasAnyPermission) {
      throw new Error(`Insufficient permissions: ${permissions.join(', ')}`);
    }
  }

  static async requireAllPermissions(
    userId: string, 
    permissions: Permission[], 
    projectId?: string
  ): Promise<void> {
    const hasAllPermissions = await this.hasAllPermissions(userId, permissions, projectId);
    
    if (!hasAllPermissions) {
      throw new Error(`Insufficient permissions: ${permissions.join(', ')}`);
    }
  }

  static async requireProjectAccess(userId: string, projectId: string): Promise<void> {
    const canAccess = await this.canAccessProject(userId, projectId);
    
    if (!canAccess) {
      throw new Error('Access denied to project');
    }
  }

  static async requireProjectManagement(userId: string, projectId: string): Promise<void> {
    const canManage = await this.canManageProject(userId, projectId);
    
    if (!canManage) {
      throw new Error('Project management access denied');
    }
  }
}
