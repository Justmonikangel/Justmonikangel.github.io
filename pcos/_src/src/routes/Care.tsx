import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Care Notes (Doctor Prep). Doctor-prep checklist, visit-log,
//         prescribed medication log (user-entered only), follow-up reminders.
//         Strictly no AI-generated treatment plan or dose recommendation.
//         See ARCHITECTURE-v2.md §11.5.
export default function Care() {
  return (
    <RoutePlaceholder
      title="看医生准备"
      description="下次复诊清单 / 医生已开药记录 / 复查提醒。即将开放。"
    />
  );
}
