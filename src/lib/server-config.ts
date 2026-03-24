import 'server-only'
import fs from 'fs'
import path from 'path'

/**
 * Get the organization ID from stored configuration
 */
export function getOrganizationId(): string {
  const config = loadConfig()
  const orgId = config.organizationId
  if (!orgId) {
    throw new Error('No organization ID configured. Please run setup first.')
  }
  return orgId
}

interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  authSource: string
  ssl: boolean
  uri: string
}

interface AppConfig {
  database?: DatabaseConfig
  setupCompleted: boolean
  organizationId?: string
}

function loadConfig(): AppConfig {
  try {
    const configPath = path.join(process.cwd(), 'config.json')
    const configData = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Error loading config:', error)
    return { setupCompleted: false }
  }
}