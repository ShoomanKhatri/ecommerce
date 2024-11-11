import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../../components/Loader";
import { useRegisterMutation } from "../../redux/api/usersApiSlice";
import { setCredentials } from "../../redux/features/auth/authSlice";
import { toast } from "react-toastify";

const Register = () => {
  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [register, { isLoading }] = useRegisterMutation();

  const { userInfo } = useSelector((state) => state.auth);

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get("redirect") || "/";

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailPattern.test(email);
    const usernamePart = email.split("@")[0];

    const firstTwoCharsPattern = /^[A-Za-z]{2}/;
    const isValidFirstTwoChars = firstTwoCharsPattern.test(usernamePart);

    if (usernamePart.length < 2) {
      return "Email username must be at least 2 characters before the @";
    }

    if (!isValidFirstTwoChars) {
      return "The first two characters of the email username must be alphabets";
    }

    const domainPattern = /@(gmail|yahoo|outlook)\.com$/;
    const isValidDomain = domainPattern.test(email);

    if (!isValidFormat) {
      return "Invalid email format";
    }

    if (!isValidDomain) {
      return "Email must be from gmail, yahoo, or outlook";
    }

    return "";
  };

  const validatePassword = (pass) => {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*]/;

    if (pass.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    if (!hasNumber.test(pass)) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar.test(pass)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const usernamePattern = /^[A-Za-z]{3}[A-Za-z0-9 ]{0,17}$/;

    const errors = [];
    if (!usernamePattern.test(username)) {
      errors.push("Username must start with at least 3 alphabetic characters and be a maximum of 20 characters long.");
    }

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      errors.push(emailValidationError);
    }

    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      errors.push(passwordValidationError);
    }

    if (errors.length > 0) {
      // Display all errors with a 1-second interval
      errors.forEach((error, index) => {
        setTimeout(() => {
          toast.error(error);
        }, index * 1000); // Each error will show after 1 second from the last
      });
      return; // Stop the submission process
    }

    try {
      const res = await register({ username, email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate(redirect);
      toast.success("User successfully registered");
    } catch (err) {
      console.log(err);
      if (err.status === 400 && err.data.message.includes("Email already taken")) {
        toast.error("Email already taken, please choose another email");
      } else {
        toast.error(err.data.message || "Registration failed");
      }
    }
  };

  return (
    <section className="pl-[10rem] flex flex-wrap">
      <div className="mr-[4rem] mt-[1.5rem]">
        <h1 className="text-2xl font-semibold mb-4">Register</h1>

        <form onSubmit={submitHandler} className="container w-[40rem]">
          <div className="my-[1.7rem]">
            <label htmlFor="name" className="block text-sm font-medium text-white">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="mt-1 p-2 border rounded w-full"
              placeholder="Enter name"
              value={username}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="my-[1.7rem]">
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 p-2 border rounded w-full"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="my-[1.7rem] relative">
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="mt-1 p-2 border rounded w-full"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(validatePassword(e.target.value));
              }}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-7 text-gray-500 text-2xl"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
            {passwordError && (
              <p className="text-red-500 text-sm mt-2">{passwordError}</p>
            )}
          </div>

          <div className="my-[0.7rem] relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              className="mt-1 p-2 border rounded w-full"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-7 text-gray-500 text-2xl"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
            {password !== confirmPassword && confirmPassword && (
              <p className="text-red-500 text-sm mt-2">Passwords do not match</p>
            )}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="bg-pink-500 text-white px-4 py-2 rounded cursor-pointer my-[1rem]"
          >
            {isLoading ? "Registering..." : "Register"}
          </button>

          {isLoading && <Loader />}
        </form>

        <div className="mt-0">
          <p className="text-white">
            Already have an account?{" "}
            <Link
              to={redirect ? `/login?redirect=${redirect}` : "/login"}
              className="text-pink-500 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Register;
