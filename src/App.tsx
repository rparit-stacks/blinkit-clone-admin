import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Orders from "./pages/orders/Orders";
import Users from "./pages/users/Users";
import Products from "./pages/products/Products";
import Stores from "./pages/stores/Stores";
import Coupons from "./pages/coupons/Coupons";
import Delivery from "./pages/delivery/Delivery";
import Admins from "./pages/admins/Admins";
import Zones from "./pages/zones/Zones";
import CMS from "./pages/cms/CMS";
import Sellers from "./pages/sellers/Sellers";
import Withdrawals from "./pages/withdrawals/Withdrawals";
import WalletOverview from "./pages/wallet/WalletOverview";
import DeliveryAssignments from "./pages/delivery/DeliveryAssignments";
import Notifications from "./pages/notifications/Notifications";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="users" element={<Users />} />
              <Route path="products" element={<Products />} />
              <Route path="stores" element={<Stores />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="delivery" element={<Delivery />} />
              <Route path="delivery/assignments" element={<DeliveryAssignments />} />
              <Route path="admins" element={<Admins />} />
              <Route path="zones" element={<Zones />} />
              <Route path="cms" element={<CMS />} />
              <Route path="sellers" element={<Sellers />} />
              <Route path="withdrawals" element={<Withdrawals />} />
              <Route path="wallet" element={<WalletOverview />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
