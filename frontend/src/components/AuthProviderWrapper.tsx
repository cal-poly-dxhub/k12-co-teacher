"use client";

import { AuthProvider } from "react-oidc-context";
import { ReactNode } from "react";

const cognitoAuthConfig = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || "",
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || "",
  redirect_uri: typeof window !== "undefined" ? window.location.origin : "",
  post_logout_redirect_uri: typeof window !== "undefined" ? window.location.origin : "",
  response_type: "code",
  scope: "openid email",
  automaticSilentRenew: false,
  loadUserInfo: false,
};

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
}
