import { useEffect, useMemo, useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Button,
  Card,
  Grid,
  NumberInput,
  Select,
  SelectItem,
  Text,
  TextInput,
  Title,
} from '@tremor/react'
import { RiAddLine, RiCloseLine } from '@remixicon/react'
import { API_BASE_URL, apiFetch, isPrivilegedRole, trainingCriteriaLabel } from '../api'
import { DataTable } from '../components/DataTable'
import { FlashMessage } from '../components/FlashMessage'
import { useSessionUser } from '../hooks/useSessionUser'

const trainingColumnHelper = createColumnHelper()

export function DiklatPage() {
  const queryClient = useQueryClient()
  const authQuery = useSessionUser()
  const user = authQuery.data?.user
  const privileged = isPrivilegedRole(user?.role)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [trainingForm, setTrainingForm] = useState({
    proposedTraining: '',
    trainingName: '',
    trainingDateText: '',
    trainingProvider: '',
    certificateNumber: '',
    certificateLink: '',
    jumlahJp: '',
    isPbj: false,
    isJabatan: false,
    isIntegritas: false,
    year: '2025',
    certificateFile: null,
  })

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch('/api/employees'),
    enabled: Boolean(user),
  })

  useEffect(() => {
    const employees = employeesQuery.data?.employees || []
    if (!user || employees.length === 0) return
    if (privileged) {
      setSelectedEmployeeId((current) => current || String(employees[0].id))
    } else {
      setSelectedEmployeeId(String(user.employeeId || ''))
    }
  }, [employeesQuery.data, privileged, user])

  const trainingsQuery = useQuery({
    queryKey: ['trainings', selectedEmployeeId],
    queryFn: () => apiFetch(`/api/trainings?employeeId=${selectedEmployeeId}`),
    enabled: Boolean(user && selectedEmployeeId),
  })

  const addTrainingMutation = useMutation({
    mutationFn: (formData) => apiFetch('/api/trainings', { method: 'POST', body: formData }),
    onSuccess: async () => {
      setStatus({ type: 'success', message: 'Diklat berhasil ditambahkan' })
      setIsModalOpen(false)
      setTrainingForm({
        proposedTraining: '',
        trainingName: '',
        trainingDateText: '',
        trainingProvider: '',
        certificateNumber: '',
        certificateLink: '',
        jumlahJp: '',
        isPbj: false,
        isJabatan: false,
        isIntegritas: false,
        year: '2025',
        certificateFile: null,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['trainings'] }),
      ])
    },
    onError: (error) => setStatus({ type: 'error', message: error.message }),
  })

  const trainingColumns = useMemo(
    () => [
      trainingColumnHelper.accessor('training_name', {
        header: 'Nama Diklat',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-blue-950">{row.original.training_name}</div>
            <div className="text-xs text-blue-900/50">{row.original.training_provider || '-'}</div>
          </div>
        ),
      }),
      trainingColumnHelper.accessor('training_date_text', { header: 'Tanggal' }),
      trainingColumnHelper.accessor('jumlah_jp', { header: 'JP' }),
      trainingColumnHelper.display({
        id: 'criteria',
        header: 'Kriteria',
        cell: ({ row }) => <span className="text-xs text-blue-900/60">{trainingCriteriaLabel(row.original)}</span>,
      }),
      trainingColumnHelper.display({
        id: 'certificate',
        header: 'Sertifikat',
        cell: ({ row }) => {
          if (row.original.certificate_file_path) {
            return <a href={`${API_BASE_URL}${row.original.certificate_file_path}`} target="_blank" rel="noreferrer">File</a>
          }
          if (row.original.certificate_link) {
            return <a href={row.original.certificate_link} target="_blank" rel="noreferrer">Link</a>
          }
          return '-'
        },
      }),
    ],
    [],
  )

  function handleSubmitTraining(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    const formData = new FormData()
    formData.set('employeeId', privileged ? selectedEmployeeId : String(user.employeeId || ''))
    formData.set('proposedTraining', trainingForm.proposedTraining)
    formData.set('trainingName', trainingForm.trainingName)
    formData.set('trainingDateText', trainingForm.trainingDateText)
    formData.set('trainingProvider', trainingForm.trainingProvider)
    formData.set('certificateNumber', trainingForm.certificateNumber)
    formData.set('certificateLink', trainingForm.certificateLink)
    formData.set('jumlahJp', trainingForm.jumlahJp)
    formData.set('isPbj', String(trainingForm.isPbj))
    formData.set('isJabatan', String(trainingForm.isJabatan))
    formData.set('isIntegritas', String(trainingForm.isIntegritas))
    formData.set('year', trainingForm.year)
    if (trainingForm.certificateFile) formData.set('certificateFile', trainingForm.certificateFile)
    addTrainingMutation.mutate(formData)
  }

  const selectedEmployee = (employeesQuery.data?.employees || []).find(
    (employee) => String(employee.id) === String(selectedEmployeeId),
  )

  return (
    <>
      <Card className="panel-card rounded-md p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Text className="!text-blue-900/45">Riwayat Diklat</Text>
            <Title className="!mt-1 !text-[22px] !font-semibold !tracking-tight !text-blue-950">
              {selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.nip})` : 'Daftar Diklat'}
            </Title>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {privileged ? (
              <div className="min-w-[320px]">
                <Text className="!mb-1 !text-xs !text-blue-900/45">Pilih Pegawai</Text>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} className="dense-input">
                  {(employeesQuery.data?.employees || []).map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name} ({employee.nip})
                    </SelectItem>
                  ))}
                </Select>
              </div>
            ) : null}
            <Button color="blue" className="!rounded-md !bg-blue-900 !px-4 !py-2.5" icon={RiAddLine} onClick={() => setIsModalOpen(true)}>
              Tambah Diklat
            </Button>
          </div>
        </div>

        <FlashMessage status={status} />
        <DataTable data={trainingsQuery.data?.trainings || []} columns={trainingColumns} emptyMessage="Belum ada data diklat." />
      </Card>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/12 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-3xl rounded-md border border-blue-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-blue-100 px-6 py-5">
              <div>
                <Text className="!text-blue-900/45">Input Diklat</Text>
                <Title className="!mt-1 !text-[22px] !font-semibold !tracking-tight !text-blue-950">Tambah Diklat Baru</Title>
              </div>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-900/50 hover:bg-blue-50" onClick={() => setIsModalOpen(false)}>
                <RiCloseLine size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <form className="space-y-4" onSubmit={handleSubmitTraining}>
                {privileged ? (
                  <div>
                    <Text className="!text-blue-900/55">Pegawai</Text>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} className="dense-input mt-1">
                      {(employeesQuery.data?.employees || []).map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                          {employee.name} ({employee.nip})
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                ) : null}
                <div>
                  <Text className="!text-blue-900/55">Usulan Diklat</Text>
                  <TextInput className="dense-input mt-1" value={trainingForm.proposedTraining} onValueChange={(value) => setTrainingForm((current) => ({ ...current, proposedTraining: value }))} />
                </div>
                <div>
                  <Text className="!text-blue-900/55">Nama Diklat</Text>
                  <TextInput className="dense-input mt-1" value={trainingForm.trainingName} onValueChange={(value) => setTrainingForm((current) => ({ ...current, trainingName: value }))} />
                </div>
                <Grid numItemsMd={2} className="gap-4">
                  <div>
                    <Text className="!text-blue-900/55">Tanggal</Text>
                    <TextInput className="dense-input mt-1" value={trainingForm.trainingDateText} onValueChange={(value) => setTrainingForm((current) => ({ ...current, trainingDateText: value }))} />
                  </div>
                  <div>
                    <Text className="!text-blue-900/55">Pelaksana</Text>
                    <TextInput className="dense-input mt-1" value={trainingForm.trainingProvider} onValueChange={(value) => setTrainingForm((current) => ({ ...current, trainingProvider: value }))} />
                  </div>
                </Grid>
                <Grid numItemsMd={2} className="gap-4">
                  <div>
                    <Text className="!text-blue-900/55">No. Sertifikat</Text>
                    <TextInput className="dense-input mt-1" value={trainingForm.certificateNumber} onValueChange={(value) => setTrainingForm((current) => ({ ...current, certificateNumber: value }))} />
                  </div>
                  <div>
                    <Text className="!text-blue-900/55">Jumlah JP</Text>
                    <NumberInput className="dense-input mt-1" value={trainingForm.jumlahJp} onValueChange={(value) => setTrainingForm((current) => ({ ...current, jumlahJp: String(value ?? '') }))} />
                  </div>
                </Grid>
                <div>
                  <Text className="!text-blue-900/55">Link Sertifikat</Text>
                  <TextInput className="dense-input mt-1" value={trainingForm.certificateLink} onValueChange={(value) => setTrainingForm((current) => ({ ...current, certificateLink: value }))} />
                </div>
                <div>
                  <Text className="!text-blue-900/55">Upload Sertifikat</Text>
                  <input className="mt-1 block w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-950/80" type="file" onChange={(event) => setTrainingForm((current) => ({ ...current, certificateFile: event.target.files?.[0] || null }))} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="xs" variant={trainingForm.isPbj ? 'primary' : 'secondary'} color="blue" className="!rounded-md" onClick={() => setTrainingForm((current) => ({ ...current, isPbj: !current.isPbj }))}>PBJ</Button>
                  <Button type="button" size="xs" variant={trainingForm.isJabatan ? 'primary' : 'secondary'} color="blue" className="!rounded-md" onClick={() => setTrainingForm((current) => ({ ...current, isJabatan: !current.isJabatan }))}>Sesuai Jabatan</Button>
                  <Button type="button" size="xs" variant={trainingForm.isIntegritas ? 'primary' : 'secondary'} color="blue" className="!rounded-md" onClick={() => setTrainingForm((current) => ({ ...current, isIntegritas: !current.isIntegritas }))}>Integritas</Button>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-blue-100 pt-4">
                  <Button type="button" variant="secondary" color="gray" className="!rounded-md" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" color="blue" className="!rounded-md !bg-blue-900" loading={addTrainingMutation.isPending}>
                    Simpan Diklat
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
