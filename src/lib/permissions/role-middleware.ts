import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { Role, hasRole } from './permission-definitions';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    role: Role;
    organization: string;
  };
}

// Simple role-based middleware
export function allowRoles(...allowedRoles: Role[]) {
  return async function (req: NextRequest): Promise<{ user: any } | NextResponse> {
    try {
      // Authenticate user
      const authResult = await authenticateUser();
      if ('error' in authResult) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      const user = authResult.user;
      const userRole = user.role as Role;

      // Check if user has one of the allowed roles
      const hasAllowedRole = allowedRoles.some(role => hasRole(userRole, role));

      if (!hasAllowedRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Return user info for use in route handlers
      return { user: { id: user.id, role: userRole, organization: user.organization } };
    } catch (error) {
      console.error('Role middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

// Helper functions for common role checks
export const allowCreate = allowRoles(Role.ADMIN, Role.LECTURER, Role.TEACHER);
export const allowRead = allowRoles(Role.ADMIN, Role.LECTURER, Role.TEACHER, Role.STUDENT);
export const allowUpdate = allowRoles(Role.ADMIN, Role.LECTURER, Role.TEACHER);
export const allowDelete = allowRoles(Role.ADMIN, Role.LECTURER, Role.TEACHER);