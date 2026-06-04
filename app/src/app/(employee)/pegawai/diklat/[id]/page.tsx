import { notFound } from "next/navigation";
import { ShellFrame } from "@/components/shell-frame";
import { TrainingDetail } from "@/components/training-detail";
import { requireCurrentUser } from "@/lib/auth";
import { getTrainingById } from "@/lib/trainings";

type EmployeeTrainingEditPageProps = {
  params: {
    id: string;
  };
};

export default async function EmployeeTrainingEditPage({
  params,
}: EmployeeTrainingEditPageProps) {
  const user = await requireCurrentUser();
  const trainingId = Number(params.id);

  if (!trainingId) {
    notFound();
  }

  const training = await getTrainingById(trainingId);

  if (!training || training.employeeId !== user.employeeId) {
    notFound();
  }

  return (
    <ShellFrame
      eyebrow="Employee Workspace"
      title="Detail diklat pribadi"
      description="Pegawai dapat melihat data diklat, sertifikat tersimpan, status verifikasi, dan catatan penolakan bila ada."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <TrainingDetail
        mode="employee"
        training={training}
        editPath={`/pegawai/diklat/${training.id}/edit`}
      />
    </ShellFrame>
  );
}
