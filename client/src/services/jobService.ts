import { api } from "./api";

import type {
  AddJobPartInput,
  AddJobPartsInput,
  CreateRepairJobInput,
  JobListParams,
  JobListResponse,
  JobPartsResponse,
  JobPartResponse,
  JobPagination,
  JobResponse,
  MechanicUpdateRepairJobInput,
  MyJobsResponse,
  RepairJob,
  RepairJobDetails,
  UpdateRepairJobInput,
} from "../types/job";

export const getJobs = async (
  params: JobListParams = {},
): Promise<{
  jobs: RepairJob[];
  pagination: JobPagination;
}> => {
  const response = await api.get<JobListResponse>("/jobs", {
    params,
  });

  return response.data.data;
};

export const getJobById = async (jobId: string): Promise<RepairJobDetails> => {
  const response = await api.get<JobResponse>(`/jobs/${jobId}`);

  return (
    response.data.data?.job ??
    (response.data as unknown as { job: RepairJobDetails }).job
  );
};

export const createJob = async (
  data: CreateRepairJobInput,
): Promise<RepairJobDetails> => {
  const response = await api.post<JobResponse>("/jobs", data);

  return (
    response.data.data?.job ??
    (response.data as unknown as { job: RepairJobDetails }).job
  );
};

export const updateJob = async (
  jobId: string,
  data: UpdateRepairJobInput,
): Promise<RepairJobDetails> => {
  const response = await api.patch<JobResponse>(`/jobs/${jobId}`, data);

  return (
    response.data.data?.job ??
    (response.data as unknown as { job: RepairJobDetails }).job
  );
};

export const updateJobAsMechanic = async (
  jobId: string,
  data: MechanicUpdateRepairJobInput,
): Promise<RepairJobDetails> => {
  const response = await api.patch<JobResponse>(
    `/jobs/${jobId}/mechanic`,
    data,
  );

  return (
    response.data.data?.job ??
    (response.data as unknown as { job: RepairJobDetails }).job
  );
};

export const deleteJob = async (jobId: string): Promise<void> => {
  await api.delete(`/jobs/${jobId}`);
};

export const getMyJobs = async (
  params: Pick<
    JobListParams,
    "page" | "limit" | "search" | "status" | "priority"
  > = {},
): Promise<{
  jobs: RepairJob[];
  pagination: JobPagination;
}> => {
  const response = await api.get<MyJobsResponse>("/jobs/my", {
    params: {
      ...params,
    },
  });

  return response.data.data;
};

export const getJobParts = async (jobId: string) => {
  const response = await api.get<JobPartsResponse>(`/jobs/${jobId}/parts`);

  return response.data.data.parts;
};

export const addJobPart = async (jobId: string, data: AddJobPartInput) => {
  const response = await api.post<JobPartResponse>(
    `/jobs/${jobId}/parts`,
    data,
  );

  return response.data.data.jobPart;
};

export const addJobParts = async (jobId: string, data: AddJobPartsInput) => {
  const response = await api.post(`/jobs/${jobId}/parts/batch`, data);
  return response.data.data.jobParts;
};

export const removeJobPart = async (
  jobId: string,
  jobPartId: string,
): Promise<void> => {
  await api.delete(`/jobs/${jobId}/parts/${jobPartId}`);
};
