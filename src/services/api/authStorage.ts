import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "nero_access_token";
const USER_ID_KEY = "nero_user_id";

export const authStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getUserId(): Promise<string | null> {
    return SecureStore.getItemAsync(USER_ID_KEY);
  },

  async setUserId(id: string): Promise<void> {
    await SecureStore.setItemAsync(USER_ID_KEY, id);
  },

  async saveSession(accessToken: string, userId: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(USER_ID_KEY, userId),
    ]);
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
    ]);
  },

  async hasSession(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return !!token;
  },
};
