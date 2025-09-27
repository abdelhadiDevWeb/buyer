import axios from "axios";
import { authStore } from "@/contexts/authStore";

type LoginInput = { login: string; password: string };
export const loginFunction = async (data: LoginInput): Promise<string> => {
  console.log(data);
  if (data.login == "" || data.password == "") {
    return "you need to add all information";
  }

  try {
    const res = await axios.post(
      `https://mazad-click-server.onrender.com/auth/signin`,
      { login: data.login, password: data.password },
      {
        withCredentials: true,
        headers: {
          "x-access-key": process.env.NEXT_PUBLIC_KEY_API_BYUER,
        },
      }
    );
    console.log(res);

    // Use authStore to store the authentication data instead of localStorage
    if (res.data && res.data.tokens) {
      const authData = {
        tokens: res.data.tokens,
        user: res.data.user
      };
      // Update authStore
      authStore.getState().set(authData);
      // No need to manually store in localStorage as the authStore handles it
    }

    return "success";

  } catch (err: any) {
    console.log("err =>", err);
    if (err?.response?.data?.message == "Invalid credentials - login") {
      return "email is wrong";
    }
    if (err?.response?.data?.message == "Invalid credentials - password") {
      return "password is wrong";
    }
    if (
      err?.response?.data?.message ==
      "login must be a valid email address or a phone number"
    ) {
      return "to login you must be a valid email address or a phone number";
    }
    return "error";
  }
};

type RegisterInput = {
  email: string;
  password: string;
  phone: string;
  firstname: string;
  lastname: string;
  gender?: string;
  type?: string;
  sellerType?: string;
};
export const registerFunction = async (data: RegisterInput): Promise<string> => {
  console.log(data);

  if (
    data.email == "" ||
    data.password == "" ||
    data.phone == "" ||
    data.firstname == "" ||
    data.lastname == "" ||
    data.gender == ""
  ) {
    return "please enter all information to register";
  }
  try {
    const res = await axios.post(
      `https://mazad-click-server.onrender.com/auth/signup`,
      {
        email: data.email,
        firstName: data.firstname,
        lastName: data.firstname,
        gender: data.gender,
        password: data.password,
        phone: data.phone,
        type: data.type,
        sellerType: data.sellerType,
      },
      {
        withCredentials: true,
        headers: {
          "x-access-key": process.env.NEXT_PUBLIC_KEY_API_BYUER,
        },
      }
    );
    console.log("res register", res);
    return "success";
  } catch (err: any) {
    console.log(err);

    if (err?.response?.data?.message == "Email already exist") {
      return "Email already exist";
    }
    if (err?.response?.data?.message == "Phone number already exist") {
      return "Phone number already exist";
    }
    return "error";
  }
};

export const getAuction = async () => {
  try {
    const res = await axios.get(`https://mazad-click-server.onrender.com/bid`, {
      headers: {
        "x-access-key": process.env.NEXT_PUBLIC_KEY_API_BYUER,
      }
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching auctions:', err);
    throw err; // Re-throw error to handle it in the component
  }
}

export const getDeatilsAuction = async (id: string) => {
  try {
    // Get auth token from authStore instead of localStorage
    const { auth } = authStore.getState();
    const token = auth?.tokens?.accessToken;

    const res = await axios.get(`https://mazad-click-server.onrender.com/bid/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        "x-access-key": process.env.NEXT_PUBLIC_KEY_API_BYUER,
      }
    });
    return res.data;
  } catch (err) {
    console.log("Validtion err from function get Details auction");
    throw err; // Re-throw error to handle it in the component
  }
}

type SendOfferInput = { id: string; offer: number };
export const sendOffer = async (data: SendOfferInput) => {
  try {
    // Get auth token from authStore instead of localStorage
    const { auth } = authStore.getState();
    const token = auth?.tokens?.accessToken;

    const res = await axios.post(`https://mazad-click-server.onrender.com/offers/${data.id}`, {
      offer: data.offer
    }, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        "x-access-key": process.env.NEXT_PUBLIC_KEY_API_BYUER,
      }
    });
    return res.data;
  } catch (err) {
    console.log("Validtion err from function send offer auction");
    throw err; // Re-throw error to handle it in the component
  }
};

// Import NotificationAPI for notification functions
import { NotificationAPI } from '@/app/api/notification';

// Notification API functions - using NotificationAPI
export const getNotifications = async () => {
  try {
    const result = await NotificationAPI.getAllNotifications();
    return result;
  } catch (err) {
    console.error('Error fetching notifications:', err);
    throw err;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const result = await NotificationAPI.getUnreadCount();
    return result;
  } catch (err) {
    console.error('Error fetching unread count:', err);
    // Return 0 as fallback
    return 0;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const result = await NotificationAPI.markAsRead(notificationId);
    return result;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    throw err;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const result = await NotificationAPI.markAllAsRead();
    return result;
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    throw err;
  }
};

