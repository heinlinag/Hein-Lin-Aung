import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Package, Settings, ArrowRight } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-tight">
            Stock Management
          </h1>
          <p className="font-sans text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage corrugated board (flute) stock orders with ease. Submit orders, track inventory, and manage your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/submit-order")}
              size="lg"
              className="font-sans font-medium h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Submit Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => setLocation("/stock-history")}
              variant="outline"
              size="lg"
              className="font-sans font-medium h-12 px-8 border-border hover:bg-secondary"
            >
              View Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-4 py-16 md:py-24 bg-secondary/30 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-12">
            Core Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Submit Order Card */}
            <div className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Submit Order</h3>
              <p className="font-sans text-sm text-muted-foreground mb-4">
                Create new flute board orders with detailed specifications including size, quantity, and board quality.
              </p>
              <button
                onClick={() => setLocation("/submit-order")}
                className="font-sans text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                Get Started <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Stock History Card */}
            <div className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 mb-4">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Stock History</h3>
              <p className="font-sans text-sm text-muted-foreground mb-4">
                View all submitted orders organized by status. Track current stock and out-of-stock items.
              </p>
              <button
                onClick={() => setLocation("/stock-history")}
                className="font-sans text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                View Orders <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Admin Panel Card */}
            <div className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Admin Panel</h3>
              <p className="font-sans text-sm text-muted-foreground mb-4">
                Manage workers, control order status, and oversee all operations with admin-level access.
              </p>
              <button
                onClick={() => setLocation("/admin")}
                className="font-sans text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                Access Admin <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans text-sm text-muted-foreground">
            Corrugated Board Management System
          </p>
        </div>
      </div>
    </div>
  );
}
