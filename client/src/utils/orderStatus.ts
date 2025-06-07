/**
 * Order status utility functions for the frontend
 */

export interface OrderStatus {
  value: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const ORDER_STATUSES: Record<string, OrderStatus> = {
  unpaid: {
    value: 'unpaid',
    label: 'Unpaid',
    description: 'Order placed but payment not received',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: '💳'
  },
  pending: {
    value: 'pending',
    label: 'Payment Pending',
    description: 'Payment information submitted, awaiting verification',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    icon: '⏳'
  },
  paid: {
    value: 'paid',
    label: 'Paid',
    description: 'Payment received, order confirmed',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: '✅'
  },
  ready_to_ship: {
    value: 'ready_to_ship',
    label: 'Ready to Ship',
    description: 'Order packed and ready for shipping',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: '📦'
  },
  shipped: {
    value: 'shipped',
    label: 'Shipped',
    description: 'Order has been shipped',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    icon: '🚚'
  },
  out_for_delivery: {
    value: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Order is out for delivery',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    icon: '🛵'
  },
  delivered: {
    value: 'delivered',
    label: 'Delivered',
    description: 'Order has been delivered',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: '🎉'
  }
};

/**
 * Get order status configuration
 */
export const getOrderStatus = (statusValue: string): OrderStatus => {
  return ORDER_STATUSES[statusValue] || {
    value: statusValue,
    label: statusValue,
    description: 'Unknown status',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: '❓'
  };
};

/**
 * Get status badge classes for Tailwind CSS
 */
export const getStatusBadgeClasses = (statusValue: string): string => {
  const status = getOrderStatus(statusValue);
  return `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`;
};

/**
 * Get all order statuses in sequence
 */
export const getAllOrderStatuses = (): OrderStatus[] => {
  return [
    ORDER_STATUSES.unpaid,
    ORDER_STATUSES.pending,
    ORDER_STATUSES.paid,
    ORDER_STATUSES.ready_to_ship,
    ORDER_STATUSES.shipped,
    ORDER_STATUSES.out_for_delivery,
    ORDER_STATUSES.delivered
  ];
};

/**
 * Get the next logical status for an order
 */
export const getNextStatus = (currentStatus: string): string | null => {
  const statusSequence = ['unpaid', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusSequence.indexOf(currentStatus);
  
  if (currentIndex === -1 || currentIndex === statusSequence.length - 1) {
    return null;
  }
  
  return statusSequence[currentIndex + 1];
};

/**
 * Check if a status is final (cannot be changed further)
 */
export const isFinalStatus = (statusValue: string): boolean => {
  return statusValue === 'delivered';
};

/**
 * Get progress percentage based on status
 */
export const getStatusProgress = (statusValue: string): number => {
  const statusSequence = ['unpaid', 'pending', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusSequence.indexOf(statusValue);
  
  if (currentIndex === -1) return 0;
  
  return Math.round(((currentIndex + 1) / statusSequence.length) * 100);
};
