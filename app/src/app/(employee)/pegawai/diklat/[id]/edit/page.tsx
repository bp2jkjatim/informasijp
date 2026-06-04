import { notFound } from "next/navigation";
import { ShellFrame } from "@/components/shell-frame";
import { TrainingForm } from "@/components/training-form";
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
      title="Edit diklat pribadi"
      description="Pegawai dapat memperbarui data diklat miliknya sendiri tanpa mengubah data pegawai lain."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <TrainingForm
        mode="employee"
        employeeOptions={[
          {
            id: training.employee.id,
            name: training.employee.name,
            nip: training.employee.nip,
          },
        ]}
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
