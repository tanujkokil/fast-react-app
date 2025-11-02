import { useState } from 'react';
import { Form, redirect, useActionData, useNavigation } from 'react-router-dom';
import { createOrder } from '../../services/apiRestaurant';
import Button from '../../ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, getCart, getTotalCartPrice } from '../cart/cartSlice';
import EmptyCart from '../cart/EmptyCart';
import store from '../../store';
import { formatCurrency } from '../../utilities/helpers';
import { fetchAddress } from '../user/userSlice';

// https://uibakery.io/regex-library/phone-number
const isValidPhone = (str) =>
  /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(
    str,
  );

function CreateOrder() {
  const dispatch = useDispatch();
  const [withPriority, setWithPriority] = useState(false);

  const {
    username,
    status: addressStatus,
    position,
    address,
    error: errorAddress,
  } = useSelector((store) => store.user);

  const isLoadingAddress = addressStatus === `loading`;

  const navigation = useNavigation();

  const isSubmitting = navigation.state === `submitting`;
  // console.log(isSubmitting);

  const fromErrors = useActionData();

  const cart = useSelector(getCart);
  // console.log(cart);
  const totalcartPrice = useSelector(getTotalCartPrice);

  const priorityPrcie = withPriority ? totalcartPrice * 0.2 : 0;

  const totalPrice = totalcartPrice + priorityPrcie;

  if (!cart.length) return <EmptyCart />;

  return (
    <div className="px-4 py-6">
      <h2 className="font-semimask-b-to-emerald-200 mb-8 text-xl">
        Ready to order? Let's go!
      </h2>

      {/* <Form method="POST" action="/order/new"> */}
      <Form method="POST">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40">First Name</label>
          <input
            type="text"
            name="customer"
            defaultValue={username}
            required
            className="input grow"
          />
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40">Phone number</label>
          <div className="grow">
            <input type="tel" name="phone" required className="input w-full" />
            {fromErrors?.phone && (
              <p className="mt-2 rounded-md bg-red-200 p-2 text-xs text-red-700">
                {fromErrors.phone}
              </p>
            )}
          </div>
        </div>
        <div className="relative mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40">Address</label>
          <div className="grow">
            <input
              type="text"
              name="address"
              required
              className="input w-full"
              disabled={isLoadingAddress}
              defaultValue={address}
            />
            {addressStatus === `error` && (
              <p className="mt-2 rounded-md bg-red-200 p-2 text-xs text-red-700">
                {errorAddress}
              </p>
            )}
          </div>
          {!position.latitide && !position.longitude && (
            <span className="absolute top-[3px] right-[3px] z-50 md:top-[5px] md:right-[5px]">
              <Button
                disabled={isSubmitting || isLoadingAddress}
                type={'small'}
                onClick={(e) => {
                  e.preventDefault();
                  dispatch(fetchAddress());
                }}
              >
                Get Position 📍
              </Button>
            </span>
          )}
        </div>
        <div className="mb-12 flex items-center gap-5">
          <input
            className="h-6 w-6 accent-yellow-400 focus:ring focus:ring-yellow-400 focus:ring-offset-2 focus:outline-none"
            type="checkbox"
            name="priority"
            id="priority"
            value={withPriority}
            onChange={(e) => setWithPriority(e.target.checked)}
          />
          <label className="font-medium" htmlFor="priority">
            Want to yo give your order priority?
          </label>
        </div>

        <div>
          <input type="hidden" name="cart" value={JSON.stringify(cart)} />
          <input
            type="hidden"
            name="position"
            value={
              position.longitude && position.latitide
                ? `${position.latitide},${position.longitude}`
                : ``
            }
          />
          <Button disabled={isSubmitting} type="primary">
            {isSubmitting
              ? `PLacing Order..`
              : `Order now for ${formatCurrency(totalPrice)}`}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  // console.log(data);

  const order = {
    ...data,
    cart: JSON.parse(data.cart),
    priority: data.priority === `true`,
  };

  const errors = {};
  if (!isValidPhone(order.phone))
    errors.phone = `please give us your correct phone number.
  We might need it to contact you.`;
  // console.log(errors);

  if (Object.keys(errors).length > 0) return errors;

  // IF evryrhing is okay ,create new order aand redirect

  const newOrder = await createOrder(order);
  // console.log(newOrder);

  // Do not overuse
  store.dispatch(clearCart());

  return redirect(`/order/${newOrder.id}`);
}

export default CreateOrder;
