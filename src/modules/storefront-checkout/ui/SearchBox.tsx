"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      router.push(`/?${params.toString()}`);
    },
    [value, router],
  );

  return (
    <form onSubmit={handleSearch} className="w-full max-w-sm">
      <Input
        type="search"
        placeholder="ค้นหาสินค้า..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="ค้นหาสินค้า"
      />
    </form>
  );
}
