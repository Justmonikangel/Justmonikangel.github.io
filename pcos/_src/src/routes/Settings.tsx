import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Full Settings page per ARCHITECTURE-v2.md §11.8.
//         Required fields: Provider dropdown, Model dropdown (provider-aware),
//         API Key (password), Proxy URL, Invite Code (P1.5), Connectivity
//         Test button, Save originals toggle, Export local data, Clear local
//         data (with confirm).
export default function Settings() {
  return (
    <RoutePlaceholder
      title="设置"
      description="Provider / Model / API Key / Proxy / Invite Code / 连通性测试。即将开放。"
    />
  );
}
