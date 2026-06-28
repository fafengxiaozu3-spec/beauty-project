import liff from "@line/liff";

export async function initLiff() {
  try {
    await liff.init({
      liffId: "2010531673-ARSQWGPx",
    });

    if (!liff.isLoggedIn()) {
      liff.login();
      return null;
    }

    const profile = await liff.getProfile();

    localStorage.setItem(
      "lineUserId",
      profile.userId
    );

    return profile;

  } catch (error) {
    console.log("LIFF Error:", error);
    return null;
  }
}