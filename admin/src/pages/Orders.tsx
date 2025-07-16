import React, { useState, useEffect, useCallback, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl, currency } from '../utils/constants';

interface OrderItem {
  productId: { _id: string; name: string; images?: string[] };
  quantity: number;
  price: number;
  size: string;
}

interface Order {
  _id: string;
  userId: { _id: string; name: string; email: string };
  items: OrderItem[];
  totalAmount: number;
  address: { street: string; city: string; state: string; zip: string; country: string };
  paymentMethod: 'COD' | 'Stripe';
  payment: boolean;
  status: string;
  date: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  ordersPerPage: number;
}

interface OrdersProps {
  token: string;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <p className="text-red-500 text-center py-12">Error rendering orders. Check console for details.</p>;
    }
    return this.props.children;
  }
}

const Orders: React.FC<OrdersProps> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState<{ [key: string]: string }>({});
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    ordersPerPage: 10,
  });
  const navigate = useNavigate();

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/csrf-token`, { withCredentials: true });
      return response.data.csrfToken || '';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.code === 'ERR_NETWORK'
            ? 'Cannot connect to the server. Please check if the backend is running and CORS is configured.'
            : error.response?.data.message || 'Error fetching CSRF token'
        );
      } else {
        toast.error('An unexpected error occurred while fetching CSRF token');
      }
      return '';
    }
  }, []);

  // Fetch all orders with pagination
  const fetchOrders = useCallback(
    async (page: number) => {
      setIsLoading(true);
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          `${backendUrl}/api/order/list`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-CSRF-Token': csrfToken,
              'Content-Type': 'application/json',
            },
            params: { page, limit: pagination.ordersPerPage },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setOrders(response.data.orders || []);
          setPagination(response.data.pagination || {
            currentPage: page,
            totalPages: Math.ceil(response.data.totalOrders / pagination.ordersPerPage),
            totalOrders: response.data.totalOrders || 0,
            ordersPerPage: pagination.ordersPerPage,
          });
        } else {
          toast.error(response.data.message || 'Failed to fetch orders');
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(
            error.code === 'ERR_NETWORK'
              ? 'Cannot connect to the server. Please check if the backend is running and CORS is configured.'
              : error.response?.data.message || 'Error fetching orders'
          );
        } else {
          toast.error('An unexpected error occurred while fetching orders');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token, fetchCsrfToken, pagination.ordersPerPage]
  );

  useEffect(() => {
    if (token) {
      fetchOrders(1);
    } else {
      toast.error('Please log in to view orders');
    }
  }, [token, fetchOrders]);

  // Handle status update
  const handleStatusUpdate = async (orderId: string) => {
    const newStatus = statusUpdates[orderId];
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success('Order status updated');
        fetchOrders(pagination.currentPage);
        setStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
        setEditingOrderId(null);
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.code === 'ERR_NETWORK'
            ? 'Cannot connect to the server. Please check if the backend is running and CORS is configured.'
            : error.response?.data.message || 'Error updating status'
        );
      } else {
        toast.error('An unexpected error occurred while updating status');
      }
    }
  };

  // Handle status input change
  const handleStatusChange = (orderId: string, value: string) => {
    setStatusUpdates((prev) => ({ ...prev, [orderId]: value }));
  };

  // Toggle edit mode
  const toggleEdit = (orderId: string) => {
    setEditingOrderId(editingOrderId === orderId ? null : orderId);
  };

  // Navigate to order details
  const handleViewOrder = (orderId: string) => {
    navigate(`/order/${orderId}`);
  };

  // Render pagination buttons
  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchOrders(i)}
          className={`mx-1 px-3 py-1 rounded ${
            pagination.currentPage === i
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="border-t pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-8">All Orders</h1>
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No orders found.</p>
      ) : (
        <ErrorBoundary>
          <>
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="py-6 border-t border-b text-gray-700 bg-white shadow-sm rounded-lg flex flex-col md:flex-row md:items-start md:justify-between gap-6 p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewOrder(order._id)}
                >
                  <div className="flex flex-col gap-4 w-full md:w-2/3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-6">
                        <img
                          src={item.productId.images && item.productId.images[0] ? item.productId.images[0] : 'https://via.placeholder.com/100'}
                          alt={item.productId.name}
                          className="w-24 h-24 object-cover rounded-md"
                          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100')}
                        />
                        <div>
                          <p className="text-lg font-medium text-gray-800">{item.productId.name}</p>
                          <div className="flex items-center gap-4 mt-2 text-base text-gray-600">
                            <p>
                              {item.quantity} x {currency}{item.price}
                            </p>
                            <p>Size: {item.size}</p>
                          </div>
                          <p className="mt-2 text-sm">
                            Date: <span className="text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
                          </p>
                          <p className="mt-1 text-sm">
                            User: <span className="text-gray-400">{order.userId.name} ({order.userId.email})</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="md:w-1/3 flex flex-col gap-2">
                    <p className="text-base font-medium">
                      Status: <span className="text-gray-600">{order.status}</span>
                    </p>
                    {editingOrderId === order._id ? (
                      <div className="flex gap-2">
                        <select
                          value={statusUpdates[order._id] || ''}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="border p-2 rounded focus:outline-none focus:border-blue-500"
                          aria-label="Order status"
                        >
                          <option value="">Select Status</option>
                          <option value="Order Placed">Order Placed</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order._id);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEdit(order._id);
                          }}
                          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEdit(order._id);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Edit Status
                      </button>
                    )}
                    <p className="text-base font-medium">
                      Payment: <span className="text-gray-600">{order.payment ? 'Paid' : 'Unpaid'}</span>
                    </p>
                    <p className="text-base font-medium">
                      Payment Method: <span className="text-gray-600">{order.paymentMethod}</span>
                    </p>
                    <p className="text-base font-medium">
                      Total: <span className="text-gray-600">{currency}{order.totalAmount}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Address: {order.address.street}, {order.address.city}, {order.address.state}, {order.address.zip},{' '}
                      {order.address.country}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => fetchOrders(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => fetchOrders(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              Showing {orders.length} of {pagination.totalOrders} orders (Page {pagination.currentPage} of{' '}
              {pagination.totalPages})
            </p>
          </>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default Orders;