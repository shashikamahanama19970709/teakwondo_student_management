'use client'

import { useState } from 'react'

export function RoleSelector() {
  const [currentRole, setCurrentRole] = useState('student')

  const handleRoleChange = (role: string) => {
    setCurrentRole(role)
    localStorage.setItem('userRole', role)
    // Force page refresh to apply new role
    window.location.reload()
  }

  const roles = [
    { id: 'admin', name: 'Administrator', color: 'bg-red-500' },
    { id: 'lecturer', name: 'Lecturer', color: 'bg-blue-500' },
    { id: 'teacher', name: 'Teacher', color: 'bg-green-500' },
    { id: 'student', name: 'Student', color: 'bg-gray-500' }
  ]

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-4">
      <div className="text-sm font-medium mb-2">Test Role:</div>
      <div className="flex gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleRoleChange(role.id)}
            className={`px-3 py-1 rounded text-white text-xs font-medium transition-colors ${
              currentRole === role.id ? role.color : 'bg-gray-300'
            }`}
          >
            {role.name}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Current: <span className="font-medium">{roles.find(r => r.id === currentRole)?.name}</span>
      </div>
    </div>
  )
}
