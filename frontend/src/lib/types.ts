export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: 'USER' | 'ADMIN';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
  _count?: { products: number };
}

export interface ProductOption {
  id: string;
  groupId: string;
  name: string;
  price: number;
  order: number;
}

export interface ProductOptionGroup {
  id: string;
  productId: string;
  name: string;
  required: boolean;
  order: number;
  options: ProductOption[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface ProductSpecs {
  manufacturer?: string;
  brand?: string;
  modelName?: string;
  origin?: string;
  mfgDate?: string;
  batteryType?: string;
  capacity?: string;
  lifespan?: string;
  kcCertNo?: string;
  voltage?: string;
  current?: string;
  weight?: string;
  dimensions?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrls: string[];
  detailImageUrls: string[];
  detailContent: string | null;
  specs: ProductSpecs | null;
  isActive: boolean;
  categoryId: string;
  category: Category;
  optionGroups?: ProductOptionGroup[];
  reviews?: Review[];
  createdAt: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  title: string | null;
  subtitle: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  optionPrice: number;
  selectedOptions: SelectedOption[];
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  optionPrice: number;
  selectedOptions: SelectedOption[];
  product: Product;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  paymentKey: string | null;
  orderId: string | null;
  paidAt: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  adminMemo: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: { id: string; username: string; name: string | null; email: string; phone: string | null };
}

export type InquiryStatus = 'PENDING' | 'ANSWERED';

export interface InquiryReply {
  id: string;
  inquiryId: string;
  adminId: string;
  content: string;
  createdAt: string;
  admin: { id: string; username: string; name: string | null };
}

export interface Inquiry {
  id: string;
  userId: string;
  title: string;
  content: string;
  isSecret: boolean;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; name: string | null };
  reply: InquiryReply | null;
}

export interface Popup {
  id: string;
  title: string;
  imageUrl: string | null;
  content: string | null;
  linkUrl: string | null;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  imageUrls: string[];
  createdAt: string;
  user: { username: string; name: string | null };
}
