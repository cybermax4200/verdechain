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
    product.status === 'ACTIVE'
      ? ('default' as const)
      : product.status === 'RECALLED'
        ? ('destructive' as const)
        : ('secondary' as const);

  return (
    <a
      href={`/products/${product.id}`}
      className="hover:border-brand-300 dark:hover:border-brand-700 group block rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-3 flex items-start justify-between">
        <Badge variant={statusVariant}>{product.status}</Badge>
        {product.productType && (
          <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
            {product.productType}
          </span>
        )}
      </div>
      <h3 className="group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-1 font-semibold text-gray-900 transition-colors dark:text-gray-100">
        {product.name}
      </h3>
      {product.sku && (
        <p className="mb-2 font-mono text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>🏢 {product.manufacturer.name}</span>
        {product.originCountry && <span>📍 {product.originCountry}</span>}
      </div>
    </a>
  );
}
