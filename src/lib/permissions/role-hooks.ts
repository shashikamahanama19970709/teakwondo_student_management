'use client';

import { usePermissions } from './permission-context';
import { Role } from './permission-definitions';

/**
 * Hook for role-based access control
 * Provides simple role checking functions for UI components
 */
export function useRoleAccess() {
  const { permissions } = usePermissions();
  const userRole = permissions?.userRole as Role;

  const hasRole = (role: Role): boolean => {
    return userRole === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return roles.includes(userRole);
  };

  const hasRoleOrHigher = (role: Role): boolean => {
    const roleHierarchy = {
      [Role.STUDENT]: 1,
      [Role.TEACHER]: 2,
      [Role.LECTURER]: 3,
      [Role.ADMIN]: 4
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[role] || 0;

    return userLevel >= requiredLevel;
  };

  const isAdmin = (): boolean => hasRole(Role.ADMIN);
  const isLecturer = (): boolean => hasRole(Role.LECTURER);
  const isTeacher = (): boolean => hasRole(Role.TEACHER);
  const isStudent = (): boolean => hasRole(Role.STUDENT);

  const canCreate = (): boolean => hasRoleOrHigher(Role.TEACHER);
  const canEdit = (): boolean => hasRoleOrHigher(Role.TEACHER);
  const canDelete = (): boolean => hasRoleOrHigher(Role.TEACHER);
  const canManage = (): boolean => hasRoleOrHigher(Role.LECTURER);

  return {
    userRole,
    hasRole,
    hasAnyRole,
    hasRoleOrHigher,
    isAdmin,
    isLecturer,
    isTeacher,
    isStudent,
    canCreate,
    canEdit,
    canDelete,
    canManage
  };
}