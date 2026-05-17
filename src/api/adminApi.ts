const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined ?? "http://localhost:8080").replace(/\/+$/, "");

function getToken() { return localStorage.getItem("adminToken") ?? ""; }

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as { success: boolean; data: T; message?: string };
  if (!res.ok || !json.success) throw new Error(json.message ?? "Request failed");
  return json.data;
}

const get  = <T>(path: string) => req<T>("GET", path);
const post = <T>(path: string, body?: unknown) => req<T>("POST", path, body);
const put  = <T>(path: string, body?: unknown) => req<T>("PUT", path, body);
const patch = <T>(path: string, body?: unknown) => req<T>("PATCH", path, body);
const del  = <T>(path: string) => req<T>("DELETE", path);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
  post<{ token: string; adminId: string; email: string; name: string; role: string }>(
    "/api/admin/login", { email, password }
  );

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  get<{
    totalUsers: number; totalOrders: number; pendingOrders: number;
    processingOrders: number; deliveredOrders: number; cancelledOrders: number;
    totalProducts: number; totalStores: number; totalDeliveryPartners: number;
    totalCoupons: number; totalRevenue: number; todayOrders: number; todayRevenue: number;
  }>("/api/admin/dashboard/stats");

// ─── Users ────────────────────────────────────────────────────────────────────
export interface AdminUser { id: string; email: string; name: string; phone: string; role: string; createdAt: string; }
export const getUsers = () => get<AdminUser[]>("/api/admin/users");
export const createUser = (body: { email: string; name: string; phone: string }) =>
  post<AdminUser>("/api/admin/users", body);
export const updateUser = (id: string, body: { email: string; name: string; phone: string }) =>
  put<AdminUser>(`/api/admin/users/${id}`, body);
export const blockUser = (id: string, block: boolean) => patch<AdminUser>(`/api/admin/users/${id}/block?block=${block}`);
export const deleteUser = (id: string) => del<void>(`/api/admin/users/${id}`);

// ─── Orders ───────────────────────────────────────────────────────────────────
export interface OrderItem { productId: string; productName: string; quantity: number; price: number; lineTotal: number; unit: string; }
export interface AdminOrder {
  id: string; userId: string; items: OrderItem[];
  subtotal: number; deliveryFee: number; taxes: number; discount: number; total: number;
  addressSnapshot: string; paymentMode: string; razorpayOrderId: string | null;
  status: string; createdAt: string; updatedAt: string;
}
export const getOrders = (status?: string) =>
  get<AdminOrder[]>(`/api/admin/orders${status ? `?status=${status}` : ""}`);
export const getOrder = (id: string) => get<AdminOrder>(`/api/admin/orders/${id}`);
export const updateOrderStatus = (id: string, status: string) =>
  patch<AdminOrder>(`/api/admin/orders/${id}/status?status=${status}`);
export const cancelOrder = (id: string) => post<AdminOrder>(`/api/admin/orders/${id}/cancel`);

// ─── Products ─────────────────────────────────────────────────────────────────
export interface AdminProduct {
  id: string; storeCategory: string; storeId: string; categorySlug: string;
  name: string; description: string | null; image: string; price: number;
  originalPrice: number; unit: string; badge: string | null; rating: number;
  available: boolean;
  /** false = rejected / pending moderation; null/undefined = legacy approved */
  approved?: boolean | null;
  restaurantId: string | null; sortOrder: number;
}
export const getProducts = (params?: { category?: string; storeId?: string }) => {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.storeId) qs.set("storeId", params.storeId);
  const q = qs.toString();
  return get<AdminProduct[]>(`/api/admin/products${q ? `?${q}` : ""}`);
};
export const createProduct = (p: Partial<AdminProduct>) => post<AdminProduct>("/api/admin/products", p);
export const updateProduct = (id: string, p: Partial<AdminProduct>) => put<AdminProduct>(`/api/admin/products/${id}`, p);
export const patchProduct = (id: string, fields: Record<string, unknown>) => patch<AdminProduct>(`/api/admin/products/${id}`, fields);
export const approveProduct = (id: string) => patchProduct(id, { approved: true, available: true });
export const rejectProduct = (id: string) => patchProduct(id, { approved: false, available: false });
export const deleteProduct = (id: string) => del<void>(`/api/admin/products/${id}`);

// ─── Stores ───────────────────────────────────────────────────────────────────
export interface AdminStore {
  id: string; storeCategory: string; name: string; description: string | null;
  image: string; coverImage: string | null; cuisineTypes: string | null;
  eta: string | null; rating: number | null; offer: string | null;
  address: string | null; phone: string | null; active: boolean; sortOrder: number;
}
export const getStores = () => get<AdminStore[]>("/api/admin/stores");
export const createStore = (s: Partial<AdminStore>) => post<AdminStore>("/api/admin/stores", s);
export const updateStore = (id: string, s: Partial<AdminStore>) => put<AdminStore>(`/api/admin/stores/${id}`, s);
export const toggleStore = (id: string, active: boolean) => patch<AdminStore>(`/api/admin/stores/${id}/toggle?active=${active}`);
export const deleteStore = (id: string) => del<void>(`/api/admin/stores/${id}`);

// ─── Coupons ──────────────────────────────────────────────────────────────────
export interface AdminCoupon {
  id: string; code: string; description: string; discountType: "PERCENT" | "FLAT";
  discountValue: number; minOrderValue: number; maxDiscount: number; usageLimit: number;
  usedCount: number; storeCategory: string | null; storeId: string | null;
  active: boolean; expiresAt: string | null; createdAt: string;
}
export const getCoupons = () => get<AdminCoupon[]>("/api/admin/coupons");
export const createCoupon = (c: Partial<AdminCoupon>) => post<AdminCoupon>("/api/admin/coupons", c);
export const updateCoupon = (id: string, c: Partial<AdminCoupon>) => put<AdminCoupon>(`/api/admin/coupons/${id}`, c);
export const toggleCoupon = (id: string, active: boolean) => patch<AdminCoupon>(`/api/admin/coupons/${id}/toggle?active=${active}`);
export const deleteCoupon = (id: string) => del<void>(`/api/admin/coupons/${id}`);

// ─── Delivery Partners ────────────────────────────────────────────────────────
export interface DeliveryPartner {
  id: string; name: string; phone: string; email: string;
  vehicleType: string; vehicleNumber: string; status: string;
  online: boolean; active: boolean; totalDeliveries: number; rating: number; createdAt: string;
  // KYC documents
  profileImage?: string; idProofUrl?: string; licenseUrl?: string; vehicleImageUrl?: string;
  // Bank details
  bankAccountNumber?: string; bankIfsc?: string; bankAccountHolderName?: string; bankName?: string; upiId?: string;
}
export const getDeliveryPartners = () => get<DeliveryPartner[]>("/api/admin/delivery-partners");
export const createDeliveryPartner = (d: Partial<DeliveryPartner>) => post<DeliveryPartner>("/api/admin/delivery-partners", d);
export const updateDeliveryPartner = (id: string, d: Partial<DeliveryPartner>) => put<DeliveryPartner>(`/api/admin/delivery-partners/${id}`, d);
export const approvePartner = (id: string) => patch<DeliveryPartner>(`/api/admin/delivery-partners/${id}/approve`);
export const blockPartner = (id: string, block: boolean) => patch<DeliveryPartner>(`/api/admin/delivery-partners/${id}/block?block=${block}`);
export const deletePartner = (id: string) => del<void>(`/api/admin/delivery-partners/${id}`);

// ─── Delivery Assignments ─────────────────────────────────────────────────────
export interface DeliveryAssignment {
  id: string; displayId: string; subOrderId: string; masterOrderId: string;
  deliveryPartnerId: string; sellerId: string; storeId: string; customerId: string;
  pickupAddress: string; deliveryAddress: string; sellerStoreName: string;
  sellerPhone?: string; customerName?: string; customerPhone?: string;
  orderSummary: string; paymentMode: string; paid: boolean;
  orderTotal: number; deliveryFee: number; status: string;
  assignedAt?: string; pickedUpAt?: string; deliveredAt?: string;
  cancelledAt?: string; cancelReason?: string; notes?: string;
  createdAt: string; updatedAt: string;
}
export const getDeliveryAssignments = (status?: string) =>
  get<DeliveryAssignment[]>(`/api/admin/delivery/assignments${status ? `?status=${status}` : ""}`);
export const assignDelivery = (subOrderId: string, deliveryPartnerId: string, deliveryFee: number) =>
  post<DeliveryAssignment>("/api/admin/delivery/assign", { subOrderId, deliveryPartnerId, deliveryFee });
export const adminUpdateAssignmentStatus = (id: string, status: string) =>
  patch<DeliveryAssignment>(`/api/admin/delivery/assignments/${id}/status`, { status });
export const getDeliveryWallets = () => get<AdminWallet[]>("/api/admin/wallet/delivery");
export const adminCreditDelivery = (partnerId: string, amountRupees: number, note: string) =>
  post<AdminTransaction>(`/api/admin/wallet/delivery/${partnerId}/credit`, { amountRupees, note });
export const adminDebitDelivery = (partnerId: string, amountRupees: number, note: string) =>
  post<AdminTransaction>(`/api/admin/wallet/delivery/${partnerId}/debit`, { amountRupees, note });

// ─── Banners ──────────────────────────────────────────────────────────────────
export interface AdminBanner {
  id?: string;
  storeCategory: string; // FOOD | BAZAAR | ELECTRONIC
  title: string;
  subtitle: string;
  code: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
}
export const getBanners = () => get<AdminBanner[]>("/api/admin/banners");
export const createBanner = (b: Partial<AdminBanner>) => post<AdminBanner>("/api/admin/banners", b);
export const updateBanner = (id: string, b: Partial<AdminBanner>) => put<AdminBanner>(`/api/admin/banners/${id}`, b);
export const toggleBanner = (id: string) => patch<AdminBanner>(`/api/admin/banners/${id}/toggle`);
export const deleteBanner = (id: string) => del<void>(`/api/admin/banners/${id}`);

// ─── CMS Sections ─────────────────────────────────────────────────────────────
export interface BannerSlide {
  title: string; subtitle: string; imageUrl: string; linkUrl: string;
  couponCode: string; bgGradient: string;
}
export interface CmsSection {
  id?: string;
  title: string;
  type: "TRENDING" | "FLASH_SALE" | "FEATURED" | "BANNER_STRIP";
  storeCategory: string | null;
  subtitle: string | null;
  badgeLabel: string | null;
  badgeColor: string | null;
  icon: string | null;
  productIds: string[];
  slides: BannerSlide[];
  active: boolean;
  sortOrder: number;
}
export const getCmsSections = () => get<CmsSection[]>("/api/admin/cms/sections");
export const createCmsSection = (s: Partial<CmsSection>) => post<CmsSection>("/api/admin/cms/sections", s);
export const updateCmsSection = (id: string, s: Partial<CmsSection>) => put<CmsSection>(`/api/admin/cms/sections/${id}`, s);
export const toggleCmsSection = (id: string) => patch<CmsSection>(`/api/admin/cms/sections/${id}/toggle`);
export const deleteCmsSection = (id: string) => del<void>(`/api/admin/cms/sections/${id}`);

// ─── Delivery Zones ───────────────────────────────────────────────────────────
export interface DeliveryZone {
  id?: string;
  name: string;
  active: boolean;
  everywhere: boolean;
  deliveryFee: number;
  minOrderForFree: number;
  etaLabel: string;
  taxRate?: number;
  polygon?: number[][];
}
export const getZones = () => get<DeliveryZone[]>("/api/admin/zones");
export const createZone = (z: Partial<DeliveryZone>) => post<DeliveryZone>("/api/admin/zones", z);
export const updateZone = (id: string, z: Partial<DeliveryZone>) => put<DeliveryZone>(`/api/admin/zones/${id}`, z);
export const toggleZone = (id: string) => patch<DeliveryZone>(`/api/admin/zones/${id}/toggle`);
export const deleteZone = (id: string) => del<void>(`/api/admin/zones/${id}`);

// ─── Wallet ───────────────────────────────────────────────────────────────────
export interface AdminWallet {
  id: string; ownerId: string; ownerType: string;
  balanceRupees: number; pendingBalanceRupees: number;
  lifetimeEarnedRupees: number; lifetimeWithdrawnRupees: number;
  active: boolean; updatedAt: string;
}
export interface AdminTransaction {
  id: string; type: string; amountRupees: number; balanceAfterRupees: number;
  referenceId?: string; referenceType?: string; note?: string; createdAt: string;
}
export interface AdminWithdrawal {
  id: string; ownerId: string; ownerType: string; amountRupees: number;
  status: string; bankAccountNumber?: string; bankIfsc?: string;
  bankAccountHolderName?: string; bankName?: string; upiId?: string;
  adminNote?: string; utrReference?: string; createdAt: string; processedAt?: string;
}
export const getPlatformWallet = () => get<AdminWallet>("/api/admin/wallet/platform");
export const getAllSellerWallets = () => get<AdminWallet[]>("/api/admin/wallet/sellers");
export const getSellerWallet = (sellerId: string) => get<AdminWallet>(`/api/admin/wallet/sellers/${sellerId}`);
export const getSellerTransactions = (sellerId: string) =>
  get<AdminTransaction[]>(`/api/admin/wallet/sellers/${sellerId}/transactions`);
export const adminCreditSeller = (sellerId: string, amountRupees: number, note: string) =>
  post<AdminTransaction>(`/api/admin/wallet/sellers/${sellerId}/credit`, { amountRupees, note });
export const adminDebitSeller = (sellerId: string, amountRupees: number, note: string) =>
  post<AdminTransaction>(`/api/admin/wallet/sellers/${sellerId}/debit`, { amountRupees, note });
export const getWithdrawals = (status?: string) =>
  get<AdminWithdrawal[]>(`/api/admin/withdrawals${status ? `?status=${status}` : ""}`);
export const approveWithdrawal = (id: string, utrReference: string) =>
  post<AdminWithdrawal>(`/api/admin/withdrawals/${id}/approve`, { utrReference });
export const rejectWithdrawal = (id: string, reason: string) =>
  post<AdminWithdrawal>(`/api/admin/withdrawals/${id}/reject`, { reason });

// ─── Admin accounts ───────────────────────────────────────────────────────────
export interface AdminAccount { id: string; email: string; name: string; role: string; active: boolean; createdAt: string; }
export const getAdmins = () => get<AdminAccount[]>("/api/admin/admins");
export const createAdmin = (a: { email: string; password: string; name: string; role: string }) =>
  post<AdminAccount>("/api/admin/admins", a);
export const deleteAdmin = (id: string) => del<void>(`/api/admin/admins/${id}`);
