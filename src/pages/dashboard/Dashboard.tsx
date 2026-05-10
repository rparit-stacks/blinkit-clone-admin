import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import {
  FiUsers, FiShoppingBag, FiBox, FiShoppingCart,
  FiTag, FiTruck, FiTrendingUp, FiClock
} from "react-icons/fi";

interface StatCardProps {
  title: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}

function StatCard({ title, value, icon: Icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{title}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  });

  return (
    <div className="min-h-full">
      <PageHeader title="Dashboard" subtitle="Platform overview at a glance" />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Today's highlight bar */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-xl p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-sm font-medium opacity-80">Today's Revenue</p>
                <p className="text-3xl font-bold mt-1">{fmt(stats.todayRevenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">Today's Orders</p>
                <p className="text-3xl font-bold mt-1">{stats.todayOrders}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">{fmt(stats.totalRevenue)}</p>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Users"   value={stats.totalUsers}   icon={FiUsers}      color="bg-blue-100 text-blue-600" />
              <StatCard title="Total Orders"  value={stats.totalOrders}  icon={FiShoppingBag} color="bg-indigo-100 text-indigo-600" />
              <StatCard title="Total Products" value={stats.totalProducts} icon={FiBox}       color="bg-green-100 text-green-600" />
              <StatCard title="Total Stores"  value={stats.totalStores}  icon={FiShoppingCart}      color="bg-orange-100 text-orange-600" />
              <StatCard title="Delivery Partners" value={stats.totalDeliveryPartners} icon={FiTruck} color="bg-pink-100 text-pink-600" />
              <StatCard title="Active Coupons" value={stats.totalCoupons} icon={FiTag}        color="bg-purple-100 text-purple-600" />
              <StatCard title="Pending Orders" value={stats.pendingOrders} icon={FiClock}     color="bg-yellow-100 text-yellow-600" />
              <StatCard title="Delivered Orders" value={stats.deliveredOrders} icon={FiTrendingUp} color="bg-emerald-100 text-emerald-600" />
            </div>

            {/* Order status breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Order Status Breakdown</h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Pending",    value: stats.pendingOrders,    color: "bg-yellow-500" },
                  { label: "Processing", value: stats.processingOrders, color: "bg-blue-500" },
                  { label: "Delivered",  value: stats.deliveredOrders,  color: "bg-green-500" },
                  { label: "Cancelled",  value: stats.cancelledOrders,  color: "bg-red-500" },
                  { label: "Total",      value: stats.totalOrders,      color: "bg-slate-500" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`h-1 ${s.color} rounded-full mb-2`} />
                    <p className="text-lg font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
