import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: {
    id: string;
    productId?: number;
    name: string;
    description?: string;
    sku?: string;
    productType?: string;
    originCountry?: string;
    status: string;
    manufacturer: { name: string; country?: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const statusVariant =
    product.status === 'ACTIVE' ? 'default' as const
    : product.status === 'RECALLED' ? 'destructive' as const
    : 'secondary' as const;

  return (
    <a
      href={`/products/${product.id}`}
      className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant={statusVariant}>{product.status}</Badge>
        {product.productType && (
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{product.productType}</span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mb-1">
        {product.name}
      </h3>
      {product.sku && (
        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">{product.sku}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>🏢 {product.manufacturer.name}</span>
        {product.originCountry && <span>📍 {product.originCountry}</span>}
      </div>
    </a>
  );
}
