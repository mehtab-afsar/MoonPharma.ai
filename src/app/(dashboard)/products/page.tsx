import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getProducts } from "@/server/services/product.server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, FlaskConical, Eye } from "lucide-react"

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const products = await getProducts(session.user.orgId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your pharmaceutical product catalogue.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      {/* Products Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            All Products
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {products.length} product{products.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <FlaskConical className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No products yet</p>
              <p className="text-xs text-gray-400">
                Add your first product to get started.
              </p>
              <Button asChild size="sm" className="mt-3 gap-2">
                <Link href="/products/new">
                  <Plus className="h-3.5 w-3.5" />
                  New Product
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">
                    Product Code
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Product Name
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Generic Name
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Dosage Form
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Strength
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    MBR Count
                  </TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-gray-100 hover:bg-gray-50/50"
                  >
                    <TableCell className="pl-6 font-mono text-xs font-medium text-gray-700">
                      {product.productCode}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {product.productName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {product.genericName ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {product.dosageForm}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {product.strength}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {(product as { _count?: { masterBatchRecords?: number } })._count?.masterBatchRecords ?? 0}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link href={`/products/${product.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
