import { prisma } from "../../src/server/db/prisma"

type SchemaRow = { schema_name: string }
type TableRow = { table_schema: string; table_name: string }

async function main() {
  const schemas = await prisma.$queryRaw<SchemaRow[]>`SELECT schema_name FROM information_schema.schemata`
  console.log('Schemas:', schemas.map((s) => s.schema_name).join(', '))

  const tables = await prisma.$queryRaw<TableRow[]>`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name`
  console.log('All tables:', tables.map((t) => `${t.table_schema}.${t.table_name}`).join(', '))
  await prisma.$disconnect()
}
main().catch(console.error)
