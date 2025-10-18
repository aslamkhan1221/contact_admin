// app/layout.tsx
import ConditionalLayout from './conditional-layout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConditionalLayout>{children}</ConditionalLayout>;
}