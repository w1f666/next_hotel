import React from 'react';
import AntdMobileSetup from './_components/AntdMobileSetup';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AntdMobileSetup>{children}</AntdMobileSetup>;
}
