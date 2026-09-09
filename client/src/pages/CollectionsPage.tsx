/*
 * Collections Page — Manage and browse Shopify collections
 */
import { Button } from "@/components/ui/button";
import {
  Archive,
  ExternalLink,
  FolderOpen,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useState } from "react";

type Collection = {
  id: string;
  title: string;
  description: string;
  productCount: number;
  status: "active" | "draft";
};

const sampleCollections: Collection[] = [
  {
    id: "col_1",
    title: "Summer Collection",
    description: "Curated summer essentials and trending seasonal products",
    productCount: 24,
    status: "active",
  },
  {
    id: "col_2",
    title: "Best Sellers",
    description: "Top-performing products ranked by conversion rate",
    productCount: 18,
    status: "active",
  },
  {
    id: "col_3",
    title: "New Arrivals",
    description: "Latest product additions to the catalog",
    productCount: 12,
    status: "active",
  },
  {
    id: "col_4",
    title: "Sale Items",
    description: "Discounted products and promotional bundles",
    productCount: 31,
    status: "active",
  },
  {
    id: "col_5",
    title: "Holiday Preview",
    description: "Draft collection for upcoming holiday campaign",
    productCount: 8,
    status: "draft",
  },
];

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collections] = useState<Collection[]>(sampleCollections);

  const filtered = searchQuery
    ? collections.filter(
        c =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : collections;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">
            <span className="eyebrow-line" /> Catalog
          </span>
          <h1 className="page-title">Collections</h1>
          <p className="page-description">
            Browse and manage your Shopify product collections. Create, edit,
            and organize product groupings for your store.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="outline" size="sm">
            <RefreshCw size={14} />
            Sync
          </Button>
          <Button size="sm">
            <Plus size={14} />
            New collection
          </Button>
        </div>
      </div>

      <div className="page-search">
        <Search size={14} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search collections..."
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X size={13} />
          </button>
        )}
      </div>

      <div className="collections-stats">
        <div className="stat-card">
          <Layers3 size={16} />
          <div>
            <strong>{collections.length}</strong>
            <span>Total collections</span>
          </div>
        </div>
        <div className="stat-card">
          <FolderOpen size={16} />
          <div>
            <strong>{collections.filter(c => c.status === "active").length}</strong>
            <span>Active</span>
          </div>
        </div>
        <div className="stat-card">
          <ShoppingCart size={16} />
          <div>
            <strong>{collections.reduce((sum, c) => sum + c.productCount, 0)}</strong>
            <span>Total products</span>
          </div>
        </div>
      </div>

      <div className="collections-grid">
        {filtered.map(collection => (
          <div className="collection-card" key={collection.id}>
            <div className="collection-card-header">
              <div className="collection-card-icon">
                <Layers3 size={18} />
              </div>
              <span
                className={`collection-status ${collection.status}`}
              >
                {collection.status}
              </span>
            </div>
            <h3 className="collection-card-title">{collection.title}</h3>
            <p className="collection-card-desc">{collection.description}</p>
            <div className="collection-card-footer">
              <span className="collection-product-count">
                {collection.productCount} products
              </span>
              <button className="collection-card-link">
                View <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="page-empty">
            No collections found
          </div>
        )}
      </div>
    </div>
  );
}
