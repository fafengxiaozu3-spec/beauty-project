import liff from "@line/liff";

const LIFF_ID = "2010531673-ARSQWGPx";

export async function initLiff() {
  await liff.init({
    liffId: LIFF_ID
  });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  const profile =
    await liff.getProfile();

  localStorage.setItem(
    "lineUserId",
    profile.userId
  );

  return profile;
}