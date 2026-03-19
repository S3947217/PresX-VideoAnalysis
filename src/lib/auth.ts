import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
  CognitoRefreshToken,
  ICognitoStorage,
} from "amazon-cognito-identity-js";

// ---------------------------------------------------------------------------
// This module runs SERVER-SIDE ONLY (API routes). No env vars are exposed
// to the browser — the client calls /api/auth/* endpoints instead.
// ---------------------------------------------------------------------------

class MemoryStorage implements ICognitoStorage {
  private store: Record<string, string> = {};

  setItem(key: string, value: string): string {
    this.store[key] = value;
    return value;
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  removeItem(key: string): boolean {
    delete this.store[key];
    return true;
  }

  clear(): object {
    this.store = {};
    return this.store;
  }
}

const memoryStorage = new MemoryStorage();

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID!,
  ClientId: process.env.COGNITO_CLIENT_ID!,
  Storage: memoryStorage,
};

const userPool = new CognitoUserPool(poolData);

// ---------------------------------------------------------------------------
// Sign Up
// ---------------------------------------------------------------------------
export function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<void> {
  const attributes = [
    new CognitoUserAttribute({ Name: "email", Value: email }),
    new CognitoUserAttribute({ Name: "name", Value: fullName }),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributes, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Confirm Sign Up
// ---------------------------------------------------------------------------
export function confirmSignUp(email: string, code: string): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: memoryStorage,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Resend Confirmation Code
// ---------------------------------------------------------------------------
export function resendConfirmationCode(email: string): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: memoryStorage,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.resendConfirmationCode((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Sign In — returns the session tokens
// ---------------------------------------------------------------------------
export function signIn(
  email: string,
  password: string
): Promise<CognitoUserSession> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: memoryStorage,
  });

  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
    });
  });
}

// ---------------------------------------------------------------------------
// Forgot Password — sends a 6-digit reset code to the user's email
// ---------------------------------------------------------------------------
export function forgotPassword(email: string): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: memoryStorage,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
      inputVerificationCode: () => resolve(),
    });
  });
}

// ---------------------------------------------------------------------------
// Confirm Password Reset — sets a new password using the verification code
// ---------------------------------------------------------------------------
export function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: memoryStorage,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

// ---------------------------------------------------------------------------
// Refresh Session — exchanges a refresh token for a new session
// ---------------------------------------------------------------------------
export function refreshSession(
  email: string,
  refreshToken: string
): Promise<CognitoUserSession> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: memoryStorage,
  });

  const token = new CognitoRefreshToken({ RefreshToken: refreshToken });

  return new Promise((resolve, reject) => {
    cognitoUser.refreshSession(token, (err: any, session: CognitoUserSession) => {
      if (err) return reject(err);
      resolve(session);
    });
  });
}
