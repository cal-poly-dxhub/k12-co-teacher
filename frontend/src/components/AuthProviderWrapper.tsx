"use client";

import { AuthProvider } from "react-oidc-context";
import { ReactNode } from "react";

const cognitoAuthConfig = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_8Uv3Cp9ro",
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || "21ppl4s7onel5b0stm7ssblnas",
  redirect_uri: process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI || (typeof window !== "undefined" ? window.location.origin : ""),
  post_logout_redirect_uri: process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI || (typeof window !== "undefined" ? window.location.origin : ""),
  response_type: "code",
  scope: "email openid phone",
  automaticSilentRenew: false,
  loadUserInfo: false,
};

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
}
