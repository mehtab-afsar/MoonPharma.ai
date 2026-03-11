export const ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",

  // eBMR App base
  EBMR: "/app/ebmr",

  // Dashboard
  DASHBOARD: "/app/ebmr/dashboard",

  // Products
  PRODUCTS: "/app/ebmr/products",
  PRODUCT_NEW: "/app/ebmr/products/new",
  PRODUCT_DETAIL: (id: string) => `/app/ebmr/products/${id}`,
  PRODUCT_EDIT: (id: string) => `/app/ebmr/products/${id}/edit`,

  // Materials
  MATERIALS: "/app/ebmr/materials",
  MATERIAL_NEW: "/app/ebmr/materials/new",
  MATERIAL_DETAIL: (id: string) => `/app/ebmr/materials/${id}`,

  // Equipment
  EQUIPMENT: "/app/ebmr/equipment",
  EQUIPMENT_NEW: "/app/ebmr/equipment/new",
  EQUIPMENT_DETAIL: (id: string) => `/app/ebmr/equipment/${id}`,

  // MBR
  MBR: "/app/ebmr/mbr",
  MBR_NEW: "/app/ebmr/mbr/new",
  MBR_DETAIL: (id: string) => `/app/ebmr/mbr/${id}`,
  MBR_EDIT: (id: string) => `/app/ebmr/mbr/${id}/edit`,
  MBR_VERSIONS: (id: string) => `/app/ebmr/mbr/${id}/versions`,

  // Batches
  BATCHES: "/app/ebmr/batches",
  BATCH_NEW: "/app/ebmr/batches/new",
  BATCH_DETAIL: (id: string) => `/app/ebmr/batches/${id}`,
  BATCH_EXECUTE: (id: string) => `/app/ebmr/batches/${id}/execute`,
  BATCH_MATERIALS: (id: string) => `/app/ebmr/batches/${id}/materials`,
  BATCH_REVIEW: (id: string) => `/app/ebmr/batches/${id}/review`,
  BATCH_REPORT: (id: string) => `/app/ebmr/batches/${id}/report`,

  // Deviations
  DEVIATIONS: "/app/ebmr/deviations",
  DEVIATION_DETAIL: (id: string) => `/app/ebmr/deviations/${id}`,

  // Review Queue
  REVIEW_QUEUE: "/app/ebmr/review",
  REVIEW_DETAIL: (batchId: string) => `/app/ebmr/review/${batchId}`,

  // Audit Trail
  AUDIT_TRAIL: "/app/ebmr/audit-trail",

  // AI Assistant
  AI_ASSISTANT: "/app/ebmr/ai-assistant",

  // Reports
  REPORTS: "/app/ebmr/reports",
  REPORT_YIELD: "/app/ebmr/reports/yield-analysis",
  REPORT_BATCH_HISTORY: "/app/ebmr/reports/batch-history",
  REPORT_DEVIATIONS: "/app/ebmr/reports/deviation-summary",
  REPORT_OOS_TRENDS: "/app/ebmr/reports/oos-trends",
  REPORT_YIELD_ANALYTICS: "/app/ebmr/reports/yield-analytics",

  // Settings
  SETTINGS: "/app/ebmr/settings",
  SETTINGS_ORG: "/app/ebmr/settings/organization",
  SETTINGS_ORGANIZATION: "/app/ebmr/settings/organization",
  SETTINGS_USERS: "/app/ebmr/settings/users",
  SETTINGS_ROLES: "/app/ebmr/settings/roles",

  // Platform
  PLATFORM: {
    ROOT: "/platform",
    TEAM: "/platform/team",
    ROLES: "/platform/roles",
    ONTOLOGY: {
      ROOT: "/ontology",
      ENTITIES: "/ontology/entities",
      ATTRIBUTES: "/ontology/attributes",
      RELATIONSHIPS: "/ontology/relationships",
      PROCESS_GRAPH: "/ontology/process-graph",
    },
    APPS: "/platform/apps",
    SUBSCRIPTION: "/platform/subscription",
  },
} as const
