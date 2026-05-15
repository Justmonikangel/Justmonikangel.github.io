import { NavLink, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDoctors } from '@/store/doctors';

export default function DoctorDetail() {
  const { id } = useParams();
  const doctor = useDoctors((s) => s.doctors.find((d) => d.id === id));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 lg:px-10">
      <div>
        <NavLink to="/doctors" className="text-xs text-cy-ink-3 hover:text-cy-ink-1">
          ← 返回医生列表
        </NavLink>
      </div>

      {doctor ? (
        <Card className="space-y-4">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-cy-ink-1 sm:text-3xl">
              {doctor.name}
            </h1>
            <p className="text-sm text-cy-ink-2">{doctor.title}</p>
            <p className="text-sm text-cy-ink-3">
              {doctor.hospital} · {doctor.city}
            </p>
          </header>

          {doctor.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {doctor.specialties.map((s) => (
                <span key={s} className="rounded-full bg-cy-bg-2 px-2 py-0.5 text-xs text-cy-ink-3">
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          {doctor.bio ? (
            <p className="text-sm leading-7 text-cy-ink-2">{doctor.bio}</p>
          ) : null}

          <p className="text-xs leading-5 text-cy-ink-3">
            Cyster 不代表这位医生提供任何在线服务，也不参与挂号转诊。
            就诊前请通过医院官网或 12320 核实出诊时间与挂号方式。
          </p>
        </Card>
      ) : (
        <Card className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">找不到这位医生</h2>
          <p className="text-sm leading-6 text-cy-ink-2">
            URL 里的 id "{id}" 不在当前列表里。可能信息已经更新或下架。
          </p>
          <NavLink to="/doctors">
            <Button type="button">回到列表</Button>
          </NavLink>
        </Card>
      )}
    </div>
  );
}
