'use client'

import React, { createContext, useContext, useMemo } from 'react'
import type { TenantContextValue, TenantSettings, TenantThemeColors, TenantFeatureFlags } from '@/types/tenant'

const defaultSettings: TenantSettings = {
  theme: {
    brand_name: '709exclusive',
    colors: {
      bg_primary: '#0B0B0C',
      bg_secondary: '#121317',
      bg_tertiary: '#1A1C22',
      bg_elevated: '#20232B',
      text_primary: '#F8F8F8',
      text_secondary: '#C9CBD1',
      text_muted: '#8A8F98',
      accent: '#E10600',
      accent_hover: '#FF1A14',
      accent_muted: '#991A1A',
      accent_blue: '#3B82F6',
      accent_blue_hover: '#60A5FA',
      accent_amber: '#F59E0B',
      accent_amber_hover: '#FBBF24',
      border_primary: '#272A33',
      border_secondary: '#343846',
      success: '#22C55E',
      warning: '#EAB308',
      error: '#EF4444',
    },
  },
  features: {
    drops: true,
    wishlist: true,
    messages: true,
    e2e_encryption: true,
    crypto_payments: true,
    local_delivery: true,
    pickup: true,
    admin: true,
    consignments: true,
  },
}

type TenantContextShape = TenantContextValue & {
  settings: TenantSettings
  featureFlags: TenantFeatureFlags
}

const TenantContext = createContext<TenantContextShape | null>(null)

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantContextValue | null
  children: React.ReactNode
}) {
  const merged = useMemo(() => {
    const settings = {
      ...defaultSettings,
      ...tenant?.settings,
      theme: {
        ...defaultSettings.theme,
        ...tenant?.settings?.theme,
        colors: {
          ...defaultSettings.theme?.colors,
          ...tenant?.settings?.theme?.colors,
        },
      },
      features: {
        ...defaultSettings.features,
        ...tenant?.settings?.features,
      },
    } as TenantSettings

    return {
      id: tenant?.id || 'default',
      slug: tenant?.slug || 'default',
      name: tenant?.name || 'Company Store',
      primary_domain: tenant?.primary_domain,
      status: tenant?.status || 'active',
      settings,
      featureFlags: settings.features || {},
    }
  }, [tenant])

  return <TenantContext.Provider value={merged}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

