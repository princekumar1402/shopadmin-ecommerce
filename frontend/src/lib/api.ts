/**
 * Cretzo Marketplace API Client
 * Centralized typed client for interacting with the Core PHP backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: number | null;
  product_count: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface Product {
  id: number;
  vendor_id?: number;
  category_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  price: number | string;
  compare_price?: number | string | null;
  stock: number;
  images: string[];
  tags?: string[];
  is_active?: number;
  created_at?: string;
  category?: string;
  category_slug?: string;
  vendor_name?: string;
  vendor_slug?: string;
  vendor_logo?: string | null;
  avg_rating: number;
  review_count: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProductDetailResponse {
  product: Product;
}

export interface ProductFilterParams {
  category?: string;
  q?: string;
  vendor_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  limit?: number;
  page?: number;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state?: string;
  zip: string;
  country?: string;
}

export interface CreateOrderParams {
  items: Array<{ product_id: number; quantity: number }>;
  shipping_address: ShippingAddress;
  payment_method?: string;
}

export interface CreateOrderResponse {
  message: string;
  order_id: number;
  total: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  vendor_id: number;
  vendor_name: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
  image?: string | null;
}

export interface OrderDetail {
  id: number;
  buyer_id: number;
  buyer_name?: string;
  buyer_email?: string;
  total_amount: string | number;
  status: string;
  shipping_addr: ShippingAddress;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderDetailResponse {
  order: OrderDetail;
}

export interface ApiError {
  error: string;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cretzo_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('cretzo_auth_token', token);
  } else {
    localStorage.removeItem('cretzo_auth_token');
  }
}

/**
 * Low-level fetch wrapper with error handling & credentials support
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Includes HttpOnly cookies cross-origin
    cache: 'no-store', // Always fetch fresh data in development
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

/**
 * Fetch all categories with product counts
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchApi<CategoriesResponse>('/categories');
    return data.categories || [];
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    return [];
  }
}

/**
 * Fetch products list with optional filters
 */
export async function getProducts(params: ProductFilterParams = {}): Promise<ProductsResponse> {
  const query = new URLSearchParams();

  if (params.category) query.set('category', params.category);
  if (params.q) query.set('q', params.q);
  if (params.vendor_id) query.set('vendor_id', params.vendor_id.toString());
  if (params.min_price !== undefined) query.set('min_price', params.min_price.toString());
  if (params.max_price !== undefined) query.set('max_price', params.max_price.toString());
  if (params.sort) query.set('sort', params.sort);
  if (params.limit !== undefined) query.set('limit', params.limit.toString());
  if (params.page !== undefined) query.set('page', params.page.toString());

  const queryString = query.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  try {
    return await fetchApi<ProductsResponse>(endpoint);
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return {
      products: [],
      total: 0,
      limit: params.limit || 20,
      offset: 0,
    };
  }
}

/**
 * Fetch single product by ID
 */
export async function getProduct(id: number): Promise<Product | null> {
  try {
    const data = await fetchApi<ProductDetailResponse>(`/products?id=${id}`);
    return data.product || null;
  } catch (err) {
    console.error(`Failed to fetch product #${id}:`, err);
    return null;
  }
}

/**
 * Submit order to the backend API
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  return await fetchApi<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Fetch order details by ID
 */
export async function getOrder(id: number): Promise<OrderDetail | null> {
  try {
    const data = await fetchApi<OrderDetailResponse>(`/orders?id=${id}`);
    return data.order || null;
  } catch (err) {
    console.error(`Failed to fetch order #${id}:`, err);
    return null;
  }
}

export async function loginVendorDemo(
  email = process.env.NEXT_PUBLIC_DEMO_VENDOR_EMAIL || '',
  password = process.env.NEXT_PUBLIC_DEMO_VENDOR_PASS || ''
): Promise<{ token: string; user: any }> {
  if (!email || !password) {
    return { token: '', user: null };
  }
  const data = await fetchApi<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Fetch active authenticated user profile
 */
export async function getCurrentUser(): Promise<any | null> {
  try {
    const data = await fetchApi<{ user: any }>('/auth/login', {
      method: 'GET',
    });
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Create a new product as vendor (POST /api/products)
 */
export async function createVendorProduct(params: {
  name: string;
  category_id?: number | null;
  price: number;
  compare_price?: number | null;
  stock: number;
  description?: string;
  images?: string[];
  tags?: string[];
}): Promise<{ message: string; id: number }> {
  return await fetchApi<{ message: string; id: number }>('/products', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Update an existing product as vendor (PUT /api/products?id=...)
 */
export async function updateVendorProduct(
  id: number,
  params: Partial<{
    name: string;
    category_id: number | null;
    price: number;
    compare_price: number | null;
    stock: number;
    description: string;
    images: string[];
    tags: string[];
    is_active: number;
  }>
): Promise<{ message: string }> {
  return await fetchApi<{ message: string }>(`/products?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

/**
 * Delete a product as vendor (DELETE /api/products?id=...)
 */
export async function deleteVendorProduct(id: number): Promise<{ message: string }> {
  return await fetchApi<{ message: string }>(`/products?id=${id}`, {
    method: 'DELETE',
  });
}

export interface VendorOrderSummary {
  id: number;
  status: string;
  total_amount: string | number;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  item_count: number;
  shipping_addr?: any;
}

export interface VendorOrdersResponse {
  orders: VendorOrderSummary[];
}

/**
 * Get vendor orders (GET /api/orders)
 */
export async function getVendorOrders(): Promise<VendorOrdersResponse> {
  return await fetchApi<VendorOrdersResponse>('/orders');
}

/**
 * Update order status (PUT /api/orders?id=...)
 */
export async function updateOrderStatus(orderId: number, status: string): Promise<{ message: string }> {
  return await fetchApi<{ message: string }>(`/orders?id=${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export interface VendorProfile {
  id: number;
  user_id: number;
  shop_name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  address: string | null;
  is_approved: number;
  owner_name: string;
  email: string;
  product_count: number;
}

/**
 * Fetch vendor public profile by vendor id (GET /api/vendors?id=...)
 */
export async function getVendorProfile(id: number): Promise<VendorProfile | null> {
  try {
    const data = await fetchApi<{ vendor: VendorProfile }>(`/vendors?id=${id}`);
    return data.vendor || null;
  } catch (err) {
    console.error(`Failed to fetch vendor #${id}:`, err);
    return null;
  }
}

// ── Admin API Client Types & Methods ────────────────────────────────────────

export interface AdminMetrics {
  total_users: number;
  total_vendors: number;
  active_products: number;
  total_products: number;
  total_orders: number;
  total_order_value: number;
}

export interface AdminRecentOrder {
  id: number;
  status: string;
  total_amount: number | string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  item_count: number;
  vendor_names: string | null;
}

export interface AdminVendor {
  id: number;
  shop_name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  is_approved: number;
  created_at: string;
  owner_name: string;
  email: string;
  product_count: number;
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  recent_orders: AdminRecentOrder[];
  recent_vendors: AdminVendor[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
  avatar?: string | null;
  vendor_id?: number | null;
}

/**
 * Login admin demo helper to acquire admin JWT token for previewing admin pages
 */
export async function loginAdminDemo(
  email = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || '',
  password = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASS || ''
): Promise<AuthUser | null> {
  if (!email || !password) {
    return null;
  }
  const res = await fetchApi<{ token: string; user: AuthUser }>('/auth/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.token) {
    setAuthToken(res.token);
  }
  return res.user;
}

/**
 * Fetch admin dashboard summary metrics and recents (GET /api/admin)
 */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return await fetchApi<AdminDashboardData>('/admin');
}

/**
 * Fetch vendors with admin filter options (GET /api/vendors?admin=1&...)
 */
export async function getAdminVendors(params?: {
  status?: 'all' | 'approved' | 'pending';
  q?: string;
}): Promise<{ vendors: AdminVendor[] }> {
  const query = new URLSearchParams({ admin: '1' });
  if (params?.status && params.status !== 'all') {
    query.set('status', params.status);
  }
  if (params?.q?.trim()) {
    query.set('q', params.q.trim());
  }
  return await fetchApi<{ vendors: AdminVendor[] }>(`/vendors?${query.toString()}`);
}

/**
 * Update vendor approval / activation status (PUT /api/vendors?id=...)
 */
export async function updateVendorApproval(
  vendorId: number,
  isApproved: number
): Promise<{ message: string }> {
  return await fetchApi<{ message: string }>(`/vendors?id=${vendorId}`, {
    method: 'PUT',
    body: JSON.stringify({ is_approved: isApproved }),
  });
}

/**
 * Fetch products with admin view (active & inactive) (GET /api/products?admin=1&...)
 */
export async function getAdminProducts(params?: {
  status?: 'all' | 'active' | 'inactive';
  q?: string;
  vendor_id?: number;
  category?: string;
  limit?: number;
  page?: number;
}): Promise<ProductsResponse> {
  const query = new URLSearchParams({ admin: '1' });
  if (params?.status) {
    query.set('status', params.status);
  }
  if (params?.q?.trim()) {
    query.set('q', params.q.trim());
  }
  if (params?.vendor_id) {
    query.set('vendor_id', params.vendor_id.toString());
  }
  if (params?.category) {
    query.set('category', params.category);
  }
  if (params?.limit) {
    query.set('limit', params.limit.toString());
  }
  if (params?.page !== undefined) {
    query.set('page', params.page.toString());
  }
  return await fetchApi<ProductsResponse>(`/products?${query.toString()}`);
}

/**
 * Toggle product active status (PUT /api/products?id=...)
 */
export async function toggleProductActive(
  productId: number,
  isActive: number
): Promise<{ message: string }> {
  return await fetchApi<{ message: string }>(`/products?id=${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  });
}

/**
 * Fetch all marketplace orders for admin view (GET /api/orders?...)
 */
export async function getAdminOrders(params?: {
  status?: string;
  q?: string;
}): Promise<{ orders: AdminRecentOrder[] }> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') {
    query.set('status', params.status);
  }
  if (params?.q?.trim()) {
    query.set('q', params.q.trim());
  }
  const qs = query.toString();
  return await fetchApi<{ orders: AdminRecentOrder[] }>(`/orders${qs ? `?${qs}` : ''}`);
}

