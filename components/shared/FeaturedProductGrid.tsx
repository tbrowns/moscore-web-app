// ProductGrid.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  // Client-side loading state for any future interactivity
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // You can move SkeletonProductCard to a separate client component if needed
          <div>Loading...</div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-square relative">
                <Image
                  fill
                  src={product.image_url}
                  alt={product.name}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
              <h3 className="text-lg font-bold mt-3 truncate">
                {product.name}
              </h3>
              <p className="text-muted-foreground mt-1 truncate">
                {product.description}
              </p>
              <p className="text-lg font-bold mt-3">Ksh.{product.price}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 w-full flex justify-center">
        <Button asChild>
          <Link href="/products" className="flex items-center">
            Browse All Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </>
  );
}
