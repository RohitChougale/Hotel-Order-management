import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import { getAuth } from "firebase/auth";
import BackButton from "../elements/BackButton";
import toast from "react-hot-toast";

interface Order {
  orderType: 'Table' | 'Parcel' | 'Swiggy-Zomato';
  id: any;
  couponId: any;
  subTotal: any;
  items: any;
  timestamp: any;
}

export default function TableOrdersPage() {
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedCoupon, setHighlightedCoupon] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", currentUser.uid, "counterOrder"),
      (snapshot) => {
        const allOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        // Filter only table orders
        const tableOrdersList = allOrders.filter(order => order.orderType === 'Table');

        // Check for new table orders (only after first load)
        if (!isFirstLoad && tableOrders.length && tableOrdersList.length > tableOrders.length) {
          const existingIds = new Set(tableOrders.map(order => order.id));
          const newTableOrders = tableOrdersList.filter(order => !existingIds.has(order.id));
          
          if (newTableOrders.length > 0) {
            newTableOrders.forEach(coupon => {
              toast.success(`New table order: COUPON-${coupon.couponId}`, {
                duration: 5000,
                style: {
                  background: '#10B981',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                },
                icon: '🍽️'
              });
            });

            // Highlight the most recent new coupon
            if (newTableOrders.length > 0) {
              const sortedNewOrders = newTableOrders.sort((a, b) => {
                const timeA = a.timestamp?.toDate?.()?.getTime?.() || 0;
                const timeB = b.timestamp?.toDate?.()?.getTime?.() || 0;
                return timeB - timeA;
              });
              
              setHighlightedCoupon(sortedNewOrders[0].id);
              
              // Remove highlight after 8 seconds
              setTimeout(() => {
                setHighlightedCoupon(null);
              }, 8000);
            }
          }
        }

        // Sort table orders in ascending order (oldest first)
        const sortedTableOrders = tableOrdersList.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.()?.getTime?.() || 0;
          const timeB = b.timestamp?.toDate?.()?.getTime?.() || 0;
          return timeA - timeB; // Ascending order
        });

        setTableOrders(sortedTableOrders);
        setLoading(false);
        
        // Mark first load as complete
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      },
      (error) => {
        console.error("Error fetching table orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, tableOrders.length, isFirstLoad]);

  // Function to get highlight class for coupon
  const getCouponHighlightClass = (orderId: string) => {
    if (highlightedCoupon === orderId) {
      return "bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 shadow-xl transform scale-105 transition-all duration-500 animate-pulse";
    }
    return "bg-white shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow duration-300";
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-700 mx-auto mb-4"></div>
          <p className="text-blue-700 font-semibold text-lg">Loading table orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <BackButton />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 text-center mb-6 mt-4">
          🍽️ Table Orders - Dining Area
        </h1>



        {tableOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl text-gray-600 font-medium">No pending table orders</p>
            <p className="text-gray-500 mt-2">All orders have been served!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tableOrders.map((order, index) => (
              <div key={order.id} className={`${getCouponHighlightClass(order.id)} rounded-xl p-6 relative`}>
                {/* Order Number Badge */}
                <div className="absolute -top-3 -left-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {/* New Order Badge */}
                {highlightedCoupon === order.id && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce">
                    NEW!
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-xl font-bold text-blue-800 mb-2">
                    COUPON-{order.couponId}
                  </h2>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>⏰ {dayjs(order.timestamp?.toDate?.()).format("HH:mm")}</span>
                    <span>📅 {dayjs(order.timestamp?.toDate?.()).format("DD-MM-YYYY")}</span>
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    <span className="bg-blue-100 px-2 py-1 rounded-full">🍽️ Table Order</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Order Items:</h3>
                  <ul className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="text-gray-600">× {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}