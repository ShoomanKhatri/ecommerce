import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import { useProfileMutation } from "../../redux/api/usersApiSlice";
import { setCredentials } from "../../redux/features/auth/authSlice";

const Profile = () => {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const [updateProfile, { isLoading: loadingUpdateProfile }] = useProfileMutation();

  useEffect(() => {
    setUserName(userInfo.username);
    setEmail(userInfo.email);
  }, [userInfo.email, userInfo.username]);

  const dispatch = useDispatch();

  // Username validation function
  const validateUsername = (username) => {
    const usernamePattern = /^[A-Za-z]{3}[A-Za-z0-9 ]{0,17}$/;
    if (!usernamePattern.test(username)) {
      return "Username must start with at least 3 alphabetic characters and be a maximum of 20 characters long.";
    }
    return "";
  };

  // Email validation function
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailPattern.test(email);
    const usernamePart = email.split("@")[0];

    if (usernamePart.length < 2) {
      return "Email username must be at least 2 characters before the @";
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

  // Password validation function
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

    // Username validation
    const usernameValidationError = validateUsername(username);
    if (usernameValidationError) {
      toast.error(usernameValidationError);
      return;
    }

    // Email validation
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      toast.error(emailValidationError);
      return;
    }

    // Password matching
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Password validation
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // Check if there are changes to apply
    const hasChanges =
      username !== userInfo.username ||
      email !== userInfo.email ||
      (password && password !== userInfo.password);

    if (!hasChanges) {
      toast.info("No changes applied");
      return;
    }

    try {
      const res = await updateProfile({
        _id: userInfo._id,
        username,
        email,
        password,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <div className="container mx-auto p-4 mt-[2rem]">
      <div className="flex justify-center align-center md:flex md:space-x-4">
        <div className="md:w-1/3">
          <h2 className="text-2xl font-semibold mb-4">Update Profile</h2>
          <form onSubmit={submitHandler}>
            <div className="mb-4">
              <label className="block text-white mb-2">Name</label>
              <input
                type="text"
                placeholder="Enter name"
                className="form-input p-4 rounded-sm w-full"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter email"
                className="form-input p-4 rounded-sm w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-4 relative">
              <label className="block text-white mb-2">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="form-input p-4 rounded-sm w-full"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-12 text-gray-500 text-2xl"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
              {passwordError && (
                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
              )}
            </div>

            <div className="mb-4 relative">
              <label className="block text-white mb-2">Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="form-input p-4 rounded-sm w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-12 text-gray-500 text-2xl"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
              {password !== confirmPassword && confirmPassword && (
                <p className="text-red-500 text-sm mt-2">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600"
              >
                Update
              </button>
            </div>
            {loadingUpdateProfile && <Loader />}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
