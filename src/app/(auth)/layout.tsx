import AuthGuard from "@/components/AuthGuard";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </AuthGuard>
  );
}
