import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import CartDrawer from "./components/storefront/CartDrawer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import SearchResults from "./pages/SearchResults";
import OrderConfirmation from "./pages/OrderConfirmation";
import AccountDashboard from "./pages/AccountDashboard";
import MyOrders from "./pages/MyOrders";
import MyWishlist from "./pages/MyWishlist";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminUsers from "./pages/admin/AdminUsers";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/catalog"} component={Catalog} />
      <Route path={"/catalog/:slug"} component={Catalog} />
      <Route path={"/search"} component={SearchResults} />
      <Route path={"/product/:slug"} component={ProductDetail} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/order-confirmation/:number"} component={OrderConfirmation} />
      <Route path={"/account"} component={AccountDashboard} />
      <Route path={"/account/orders"} component={MyOrders} />
      <Route path={"/account/wishlist"} component={MyWishlist} />
      <Route path={"/admin"} component={AdminOverview} />
      <Route path={"/admin/products"} component={AdminProducts} />
      <Route path={"/admin/orders"} component={AdminOrders} />
      <Route path={"/admin/coupons"} component={AdminCoupons} />
      <Route path={"/admin/banners"} component={AdminBanners} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <CartProvider>
            <Router />
            <CartDrawer />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
