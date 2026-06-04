import { notFound } from "next/navigation";
import { ShellFrame } from "@/components/shell-frame";
import { TrainingForm } from "@/components/training-form";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const [training, employees] = await Promise.all([
    getTrainingById(trainingId),
    prisma.employee.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        nip: true,
        name: true,
      },
    }),
  ]);

  if (!training) {
    notFound();
  }

  return (
    <ShellFrame
      eyebrow="Admin Workspace"
      title="Edit data diklat"
      description="Admin dapat memperbarui data diklat yang sudah tersimpan. Perubahan langsung menulis ke database aktif."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <TrainingForm
        mode="admin"
        employeeOptions={employees}
        defaultEmployeeId={training.employeeId}
        submitUrl={`/api/trainings/${training.id}`}
        submitMethod="PATCH"
        submitLabel="Simpan perubahan"
        initialValues={{
          trainingName: training.trainingName,
          trainingProvider: training.trainingProvider || "",
          trainingDateText: training.trainingDateText || "",
          certificateNumber: training.certificateNumber || "",
          certificateLink: training.certificateLink || "",
          jumlahJp: Number(training.jumlahJp),
          year: training.year,
          proposedTraining: training.proposedTraining || "",
          certificateFilePath: training.certificateFilePath,
          isPbj: training.isPbj,
          isJabatan: training.isJabatan,
          isIntegritas: training.isIntegritas,
        }}
      />
    </ShellFrame>
  );
}
