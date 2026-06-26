import { useEffect } from "react";

function AuthGuard({ children }) {
  useEffect(() => {
    const userId = localStorage.getItem("lineUserId");

    if (!userId) {
      window.location.href =
        "https://access.line.me/oauth2/v2.1/authorize?YOUR_LINE_LOGIN_URL";
    }
  }, []);

  return children;
}

export default AuthGuard;