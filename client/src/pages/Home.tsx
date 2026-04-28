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
            PP4 Manual Slitter<br />Stock Management
          </h1>
          <p className="font-sans text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage manual slitter stock orders with ease. Submit orders, track inventory, and manage your team.
          </p>
        </div>
      </div>

      {/* Features Grid with Colored Cards */}
      <div className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Submit Order Card - Blue */}
            <div 
              onClick={() => setLocation("/submit-order")}
              className="p-6 bg-blue-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white/20 mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Submit Order</h3>
              <p className="font-sans text-sm text-blue-100 mb-4">
                Create new manual slitter orders with detailed specifications.
              </p>
              <div className="flex items-center gap-1 font-sans text-sm font-medium text-white">
                Get Started <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Stock History Card - Green */}
            <div 
              onClick={() => setLocation("/stock-history")}
              className="p-6 bg-green-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white/20 mb-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Stock History</h3>
              <p className="font-sans text-sm text-green-100 mb-4">
                View all submitted orders organized by status. Track current and out-of-stock items.
              </p>
              <div className="flex items-center gap-1 font-sans text-sm font-medium text-white">
                View Orders <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Admin Panel Card - Red */}
            <div 
              onClick={() => setLocation("/admin")}
              className="p-6 bg-red-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white/20 mb-4">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Admin</h3>
              <p className="font-sans text-sm text-red-100 mb-4">
                Manage workers, control order status, and oversee all operations.
              </p>
              <div className="flex items-center gap-1 font-sans text-sm font-medium text-white">
                Access Admin <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-8 border-t border-border mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans text-sm text-muted-foreground">
            PP4 Manual Slitter Stock Management System
          </p>
        </div>
      </div>
    </div>
  );
}
