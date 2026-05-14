/**
 * Per-route sidebar preset. Sidebar reads the active route key and renders
 * { title, subtitle, links } accordingly. ARCHITECTURE-v2.md §11.1.
 */
export interface SidebarLink {
  label: string;
  to: string;
  hint?: string;
}

export interface SidebarPreset {
  title: string;
  subtitle: string;
  links: SidebarLink[];
}

export const sidebarPresets: Record<string, SidebarPreset> = {
  amitheone: {
    title: '是我吗？',
    subtitle: '30 秒 PCOS 特征自测',
    links: [
      { label: '开始自测', to: '/' },
      { label: '历史结果', to: '/profile', hint: '所有自测留存在你的本地' },
    ],
  },
  report: {
    title: '报告识读',
    subtitle: '把化验单翻译成人话',
    links: [
      { label: '上传新报告', to: '/report/upload' },
      { label: '历史报告', to: '/report' },
    ],
  },
  stories: {
    title: 'Sisters 的故事',
    subtitle: '你不是一个人',
    links: [
      { label: '全部故事', to: '/stories' },
    ],
  },
  knowledge: {
    title: '科普卡片',
    subtitle: '每张都有真文献',
    links: [
      { label: '全部卡片', to: '/knowledge' },
    ],
  },
  care: {
    title: '看医生准备',
    subtitle: '清单 / 已开药 / 复诊',
    links: [
      { label: '看医生清单', to: '/care' },
    ],
  },
  cycle: {
    title: '周期追踪',
    subtitle: '月经 / 排卵 / 症状',
    links: [
      { label: '本月概览', to: '/cycle' },
    ],
  },
  doctors: {
    title: '医生信息',
    subtitle: '公开渠道整理',
    links: [
      { label: '全部医生', to: '/doctors' },
    ],
  },
  agent: {
    title: 'Cyster Agent',
    subtitle: 'PCOS 识读对话',
    links: [
      { label: '新对话', to: '/agent' },
    ],
  },
  profile: {
    title: '我的',
    subtitle: '账户 / 数据 / 设置',
    links: [
      { label: '个人主页', to: '/profile' },
      { label: '设置', to: '/profile/settings' },
    ],
  },
};

/**
 * Map a hash route to its sidebar preset key.
 */
export function presetKeyForPath(pathname: string): keyof typeof sidebarPresets {
  if (pathname.startsWith('/report')) return 'report';
  if (pathname.startsWith('/stories')) return 'stories';
  if (pathname.startsWith('/knowledge')) return 'knowledge';
  if (pathname.startsWith('/care')) return 'care';
  if (pathname.startsWith('/cycle')) return 'cycle';
  if (pathname.startsWith('/doctors')) return 'doctors';
  if (pathname.startsWith('/agent')) return 'agent';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'amitheone';
}
