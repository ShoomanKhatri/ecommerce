import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Message from "../../components/Message";
import ProgressSteps from "../../components/ProgressSteps";
import Loader from "../../components/Loader";
import { useCreateOrderMutation } from "../../redux/api/orderApiSlice";
import { clearCartItems } from "../../redux/features/cart/cartSlice";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const [createOrder, { isLoading, error }] = useCreateOrderMutation();
  const dispatch = useDispatch();

  useEffect(() => {
    // Redirect to shipping if address is missing
    if (!cart.shippingAddress.address) {
      navigate("/shipping");
    }
  }, [cart.shippingAddress.address, navigate]);

  // New useEffect to handle the success response from eSewa
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const oid = query.get("oid");
    const amt = query.get("amt");
    const refId = query.get("refId");

    if (oid && amt && refId) {
      // Handle successful payment
      toast.success("Payment Successful!");
      dispatch(clearCartItems());  // Clear the cart after successful payment
      navigate("/");  // Redirect to the homepage
    }
  }, [dispatch, navigate]);

  const placeOrderHandler = async () => {
    try {
      const res = await createOrder({
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
      }).unwrap();
   console.log('orderitems',res)

      if (res.esewaUrl) {
        // Redirect to eSewa payment page
        window.location.href = res.esewaUrl;
      } else {
        // Handle non-eSewa payment flow
        dispatch(clearCartItems());
        toast.success("Your Order has been placed")
        navigate(`/`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
//   console.log({
//   orderItems: cart.cartItems,
//   shippingAddress: cart.shippingAddress,
//   paymentMethod: cart.paymentMethod,
//   itemsPrice: cart.itemsPrice,
//   shippingPrice: cart.shippingPrice,
//   taxPrice: cart.taxPrice,
//   totalPrice: cart.totalPrice,
// });



  return (
    <>
      <ProgressSteps step1 step2 step3 />
      <div className="container mx-20 mt-8">
        {cart.cartItems.length === 0 ? (
          <Message>Your cart is empty</Message>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <td className="px-1 py-2 text-left">Product</td>
                  <td className="px-1 py-2 text-left">Quantity</td>
                  <td className="px-1 py-2 text-left">Price</td>
                  <td className="px-1 py-2 text-left">Total</td>
                </tr>
              </thead>
              <tbody>
                {cart.cartItems.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-25 h-16 object-contain"
                      />
                    </td>
                    <td className="p-2">
                      <Link to={`/product/${item.product}`}>{item.name}</Link>
                    </td>
                    <td className="p-2">Rs&nbsp;{item.price.toFixed(2)}</td>
                    <td className="p-2">Rs&nbsp;{(item.qty * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-5">Order Summary</h2>
          <div className="flex justify-between flex-wrap p-8 bg-[#181818]">
            <ul className="text-lg">
              <li>
                <span className="font-semibold">Items:</span> Rs&nbsp;{cart.itemsPrice}
              </li>
              <li>
                <span className="font-semibold">Shipping:</span> Rs&nbsp;{cart.shippingPrice}
              </li>
              <li>
                <span className="font-semibold">Tax:</span> Rs&nbsp;{cart.taxPrice}
              </li>
              <li>
                <span className="font-semibold">Total:</span> Rs&nbsp;{cart.totalPrice}
              </li>
            </ul>
            {error && <Message variant="danger">{error.data.message}</Message>}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Shipping</h2>
              <p>
                <strong>Address:</strong> {cart.shippingAddress.address},{" "}
                {cart.shippingAddress.city} {cart.shippingAddress.postalCode},{" "}
                {cart.shippingAddress.country}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Payment Method</h2>
              <strong>Method:</strong> {cart.paymentMethod}
            </div>
          </div>

          <button
            type="button"
            className="bg-blue-500 text-white py-2 px-4 rounded-full text-lg w-full mt-4"
            disabled={cart.cartItems.length === 0 || isLoading}
            onClick={placeOrderHandler}
          >
            Place Order
          </button>
          {isLoading && <Loader />}
        </div>
      </div>
    </>
  );
};

export default PlaceOrder;
