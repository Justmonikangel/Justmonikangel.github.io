import { NavLink } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { useDoctors } from '@/store/doctors';

export default function Doctors() {
  const doctors = useDoctors((s) => s.doctors);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">
          医生信息库
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          仅展示，不撮合
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-cy-ink-2">
          来自医院公开页面整理的 PCOS 相关医生信息。Cyster 不做在线问诊撮合，
          也不收取转诊费用——这只是个找人参考清单。最新信息以医院官网或 12320 卫生热线为准。
        </p>
      </header>

      {doctors.length === 0 ? (
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">还没有医生条目</h2>
          <p className="text-sm text-cy-ink-3">
            P1 阶段我们只放公开渠道整理的少量信息。如果你希望推荐 PCOS 方向友好的医生，
            可以通过 Profile 页的导出/反馈通道告诉我们。
          </p>
        </Card>
      ) : (
        <section className="grid gap-3 md:grid-cols-2">
          {doctors.map((doc) => (
            <NavLink key={doc.id} to={`/doctors/${doc.id}`}>
              <Card className="h-full space-y-2 transition-shadow hover:shadow-cyster">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-cy-ink-1">{doc.name}</h3>
                  <span className="text-xs text-cy-ink-3">{doc.city}</span>
                </div>
                <p className="text-sm text-cy-ink-2">{doc.title}</p>
                <p className="text-xs text-cy-ink-3">{doc.hospital}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.specialties.map((s) => (
                    <span key={s} className="rounded-full bg-cy-bg-2 px-2 py-0.5 text-xs text-cy-ink-3">
                      {s}
                    </span>
                  ))}
                </div>
              </Card>
            </NavLink>
          ))}
        </section>
      )}
    </div>
  );
}
