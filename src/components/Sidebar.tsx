import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiGrid, FiUsers, FiShoppingBag, FiBox, FiShoppingCart,
  FiTag, FiTruck, FiLogOut, FiShield, FiChevronRight, FiMapPin, FiLayout, FiStar,
  FiCreditCard, FiArrowDownCircle
} from "react-icons/fi";

const navItems = [
  { to: "/", icon: FiGrid, label: "Dashboard" },
  { to: "/orders", icon: FiShoppingBag, label: "Orders" },
  { to: "/users", icon: FiUsers, label: "Users" },
  { to: "/products", icon: FiBox, label: "Products" },
  { to: "/stores", icon: FiShoppingCart, label: "Stores" },
  { to: "/sellers", icon: FiStar, label: "Sellers" },
  { to: "/wallet", icon: FiCreditCard, label: "Wallets" },
  { to: "/withdrawals", icon: FiArrowDownCircle, label: "Withdrawals" },
  { to: "/coupons", icon: FiTag, label: "Coupons" },
  { to: "/delivery", icon: FiTruck, label: "Delivery Partners" },
  { to: "/delivery/assignments", icon: FiTruck, label: "Assignments" },
  { to: "/cms", icon: FiLayout, label: "Content (CMS)" },
  { to: "/zones", icon: FiMapPin, label: "Delivery Zones" },
  { to: "/admins", icon: FiShield, label: "Admin Accounts" },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Nainital Admin</p>
            <p className="text-white/40 text-[10px]">Management Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-white/60 hover:bg-sidebar-hover hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <FiChevronRight className="w-3 h-3 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center shrink-0">
            <span className="text-primary-500 font-bold text-xs">
              {admin?.name?.charAt(0).toUpperCase() ?? "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{admin?.name}</p>
            <p className="text-white/40 text-[10px] truncate">{admin?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-sidebar-hover text-sm transition-colors"
        >
          <FiLogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
