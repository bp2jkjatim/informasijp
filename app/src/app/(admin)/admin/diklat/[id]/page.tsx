import { notFound } from "next/navigation";
import { ShellFrame } from "@/components/shell-frame";
import { TrainingDetail } from "@/components/training-detail";
import { requireAdminUser } from "@/lib/auth";
import { getTrainingById } from "@/lib/trainings";

type AdminTrainingEditPageProps = {
  params: {
    id: string;
  };
};

export default async function AdminTrainingEditPage({ params }: AdminTrainingEditPageProps) {
  const user = await requireAdminUser();
  const trainingId = Number(params.id);

  if (!trainingId) {
    notFound();
  }

  const training = await getTrainingById(trainingId);

  if (!training) {
    notFound();
  }

  return (
    <ShellFrame
      eyebrow="Admin Workspace"
      title="Detail data diklat"
      description="Admin dapat melihat sertifikat, mengecek link atau file, lalu menetapkan hasil verifikasi."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <TrainingDetail
        mode="admin"
        training={training}
        editPath={`/admin/diklat/${training.id}/edit`}
      />
    </ShellFrame>
  );
}
