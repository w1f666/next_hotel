'use client';

import 'antd-mobile/es/global';
import { unstableSetRender } from 'antd-mobile';
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';

// React 19 兼容性补丁 — 全局只执行一次
unstableSetRender((node: React.ReactNode, container: Element | DocumentFragment) => {
  const root: Root = createRoot(container as HTMLElement);
  root.render(node);
  return async () => { root.unmount(); };
});

export default function AntdMobileSetup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
