#!/usr/bin/env tsx
/**
 * Audit script to check tenant_id coverage in API routes
 * 
 * This script checks:
 * 1. API routes import getTenantFromRequest or requireTenantAuth
 * 2. Queries include .eq('tenant_id', ...) filters
 * 3. Super admin routes use requireSuperAdmin
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

interface AuditResult {
  path: string
  hasTenantImport: boolean
  hasTenantUsage: boolean
  hasTenantFilter: boolean
  isSuperAdminRoute: boolean
  issues: string[]
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      walkDir(filePath, fileList)
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

function auditRoute(filePath: string): AuditResult {
  const content = readFileSync(filePath, 'utf-8')
  const issues: string[] = []
  
  // Check imports
  const hasTenantImport = /import.*getTenantFromRequest|requireTenantAuth|requireSuperAdmin/.test(content)
  const hasTenantUsage = /getTenantFromRequest|requireTenantAuth|requireSuperAdmin/.test(content)
  const hasTenantFilter = /\.eq\(['"]tenant_id['"]/.test(content)
  const isSuperAdminRoute = filePath.includes('/admin/tenants')
  
  // Check for database queries without tenant filtering
  const hasDbQuery = /\.from\(['"]/.test(content)
  const hasSelect = /\.select\(/.test(content)
  const hasInsert = /\.insert\(/.test(content)
  const hasUpdate = /\.update\(/.test(content)
  const hasDelete = /\.delete\(/.test(content)
  
  // Public routes that might not need tenant filtering
  const isPublicRoute = filePath.includes('/api/diagnostic') || 
                        filePath.includes('/api/test') ||
                        filePath.includes('/webhook') ||
                        filePath.includes('/cron/')
  
  if (!isSuperAdminRoute && !isPublicRoute) {
    if (hasDbQuery && !hasTenantImport) {
      issues.push('Has database queries but no tenant import')
    }
    
    if (hasDbQuery && !hasTenantUsage) {
      issues.push('Has database queries but no tenant usage')
    }
    
    if ((hasSelect || hasInsert || hasUpdate || hasDelete) && !hasTenantFilter && !isPublicRoute) {
      issues.push('Has database operations but no tenant_id filter')
    }
  }
  
  if (isSuperAdminRoute && !content.includes('requireSuperAdmin')) {
    issues.push('Super admin route missing requireSuperAdmin check')
  }
  
  return {
    path: filePath.replace(process.cwd() + '/', ''),
    hasTenantImport,
    hasTenantUsage,
    hasTenantFilter,
    isSuperAdminRoute,
    issues,
  }
}

function main() {
  console.log('🔍 Auditing tenant isolation in API routes...\n')
  
  const apiDir = join(process.cwd(), 'app', 'api')
  const routes = walkDir(apiDir)
  
  console.log(`Found ${routes.length} API routes\n`)
  
  const results = routes.map(auditRoute)
  const routesWithIssues = results.filter(r => r.issues.length > 0)
  
  if (routesWithIssues.length === 0) {
    console.log('✅ All routes look good!')
    return
  }
  
  console.log(`⚠️  Found ${routesWithIssues.length} routes with potential issues:\n`)
  
  for (const result of routesWithIssues) {
    console.log(`📄 ${result.path}`)
    for (const issue of result.issues) {
      console.log(`   ❌ ${issue}`)
    }
    console.log()
  }
  
  console.log('\n📊 Summary:')
  console.log(`   Total routes: ${results.length}`)
  console.log(`   Routes with tenant import: ${results.filter(r => r.hasTenantImport).length}`)
  console.log(`   Routes with tenant usage: ${results.filter(r => r.hasTenantUsage).length}`)
  console.log(`   Routes with tenant filter: ${results.filter(r => r.hasTenantFilter).length}`)
  console.log(`   Super admin routes: ${results.filter(r => r.isSuperAdminRoute).length}`)
  console.log(`   Routes with issues: ${routesWithIssues.length}`)
}

main()
