/// <reference types="jest" />

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  clearAuthToken,
  clearRefreshToken,
  getAuthToken,
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
} from "../authTokenStorage";

const mockSecureStoreAvailable =
  SecureStore.isAvailableAsync as jest.MockedFunction<typeof SecureStore.isAvailableAsync>;
const mockSecureStoreGetItem =
  SecureStore.getItemAsync as jest.MockedFunction<typeof SecureStore.getItemAsync>;
const mockAsyncStorageGetItem =
  AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("authTokenStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStoreAvailable.mockResolvedValue(true);
  });

  it("does not migrate legacy AsyncStorage auth token", async () => {
    mockSecureStoreGetItem.mockResolvedValue(null);
    mockAsyncStorageGetItem.mockResolvedValue("legacy-token");

    const token = await getAuthToken();

    expect(token).toBeNull();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith("userToken");
  });

  it("stores token in SecureStore and removes legacy key", async () => {
    await setAuthToken("new-token");

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("userToken", "new-token");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("userToken");
  });

  it("clears token from both SecureStore and AsyncStorage", async () => {
    await clearAuthToken();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("userToken");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("userToken");
  });

  it("does not migrate legacy AsyncStorage refresh token", async () => {
    mockSecureStoreGetItem.mockResolvedValue(null);
    mockAsyncStorageGetItem.mockResolvedValue("legacy-refresh-token");

    const token = await getRefreshToken();

    expect(token).toBeNull();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith("refreshToken");
  });

  it("stores and clears refresh token using secure storage", async () => {
    await setRefreshToken("new-refresh-token");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("refreshToken", "new-refresh-token");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("refreshToken");

    await clearRefreshToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("refreshToken");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("refreshToken");
  });
});
