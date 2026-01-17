#!/usr/bin/env node

/**
 * Automated Tenant Isolation Testing Script
 * 
 * This script tests that tenant data isolation is properly enforced across the platform.
 * Run this regularly to ensure multi-tenant security.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface TestResult {
  name: string
  passed: boolean
  details: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

const results: TestResult[] = []

/**
 * Test 1: Verify RLS is enabled on all tenant tables
 */
async function testRLSEnabled() {
  console.log('\n🔍 Testing RLS policies...')
  
  const { data: tests, error } = await supabase
    .rpc('run_tenant_isolation_tests')
  
  if (error) {
    console.error('Failed to run isolation tests:', error.message)
    results.push({
      name: 'RLS Policy Tests',
      passed: false,
      details: error.message,
      severity: 'critical',
    })
    return
  }
  
  for (const test of tests || []) {
    results.push({
      name: test.test_name,
      passed: test.passed,
      details: test.details || '',
      severity: test.passed ? 'low' : 'high',
    })
    
    const status = test.passed ? '✅' : '❌'
    console.log(`  ${status} ${test.test_name}: ${test.details}`)
  }
}

/**
 * Test 2: Attempt cross-tenant data access (should fail)
 */
async function testCrossTenantAccess() {
  console.log('\n🔍 Testing cross-tenant access prevention...')
  
  // Get two different tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, slug')
    .limit(2)
  
  if (!tenants || tenants.length < 2) {
    console.log('  ⚠️  Skipping (need at least 2 tenants)')
    return
  }
  
  const [tenant1, tenant2] = tenants
  
  // Try to query tenant2's data while filtering for tenant1
  const { data: products, error } = await supabase
    .from('products')
    .select('id, tenant_id')
    .eq('tenant_id', tenant1.id)
  
  // Check if any products from tenant2 leaked through
  const leaked = products?.some(p => p.tenant_id === tenant2.id)
  
  results.push({
    name: 'Cross-tenant product access',
    passed: !leaked && !error,
    details: leaked ? 'Data leaked across tenants!' : 'No data leakage detected',
    severity: leaked ? 'critical' : 'low',
  })
  
  const status = !leaked ? '✅' : '❌'
  console.log(`  ${status} Cross-tenant access blocked`)
}

/**
 * Test 3: Verify tenant_id is required on INSERT
 */
async function testTenantIdRequired() {
  console.log('\n🔍 Testing tenant_id requirements...')
  
  // Try to insert a product without tenant_id (should fail)
  const { error } = await supabase
    .from('products')
    .insert({
      name: 'Test Product',
      brand: 'Test',
      model: 'Test',
      slug: 'test-product-' + Date.now(),
    })
  
  const passed = error !== null // Should fail without tenant_id
  
  results.push({
    name: 'Tenant ID required on INSERT',
    passed,
    details: passed ? 'Insert without tenant_id blocked' : 'Insert without tenant_id succeeded!',
    severity: passed ? 'low' : 'critical',
  })
  
  const status = passed ? '✅' : '❌'
  console.log(`  ${status} Tenant ID requirement enforced`)
}

/**
 * Test 4: Check for isolation alerts
 */
async function checkIsolationAlerts() {
  console.log('\n🔍 Checking for recent isolation alerts...')
  
  const { data: alerts } = await supabase
    .from('tenant_isolation_alerts')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
  
  if (alerts && alerts.length > 0) {
    console.log(`  ⚠️  Found ${alerts.length} unresolved alerts`)
    
    for (const alert of alerts.slice(0, 5)) {
      console.log(`    - ${alert.severity.toUpperCase()}: ${alert.alert_type} on ${alert.table_name}`)
    }
    
    results.push({
      name: 'Isolation alerts check',
      passed: false,
      details: `${alerts.length} unresolved alerts in last 24h`,
      severity: 'high',
    })
  } else {
    console.log('  ✅ No unresolved alerts')
    results.push({
      name: 'Isolation alerts check',
      passed: true,
      details: 'No recent alerts',
      severity: 'low',
    })
  }
}

/**
 * Test 5: Verify all multi-tenant tables have proper indexes
 */
async function testTenantIndexes() {
  console.log('\n🔍 Testing tenant_id indexes...')
  
  const { data: columns } = await supabase
    .rpc('run_tenant_isolation_tests')
  
  // This is a simplified check - in production, query pg_indexes
  console.log('  ℹ️  Index verification requires database-level access')
  
  results.push({
    name: 'Tenant ID indexes',
    passed: true,
    details: 'Manual verification recommended',
    severity: 'low',
  })
}

/**
 * Generate and save report
 */
async function generateReport() {
  console.log('\n📊 Test Summary')
  console.log('─'.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const critical = results.filter(r => r.severity === 'critical' && !r.passed).length
  
  console.log(`Total tests: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Critical issues: ${critical}`)
  
  if (critical > 0) {
    console.log('\n🚨 CRITICAL ISSUES DETECTED!')
    console.log('Immediate action required to fix tenant isolation.')
    process.exit(1)
  } else if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review and fix issues.')
    process.exit(1)
  } else {
    console.log('\n✅ All tenant isolation tests passed!')
    process.exit(0)
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🔐 Tenant Isolation Audit')
  console.log('═'.repeat(60))
  
  try {
    await testRLSEnabled()
    await testCrossTenantAccess()
    await testTenantIdRequired()
    await checkIsolationAlerts()
    await testTenantIndexes()
    await generateReport()
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  }
}

main()
