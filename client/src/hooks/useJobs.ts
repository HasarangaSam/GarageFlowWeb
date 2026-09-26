import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addJobPart,
  addJobParts,
  createJob,
  deleteJob,
  getJobById,
  getJobParts,
  getJobs,
  getMyJobs,
  removeJobPart,
  updateJob,
  updateJobAsMechanic,
} from "../services/jobService";

import type {
  AddJobPartInput,
  AddJobPartsInput,
  CreateRepairJobInput,
  JobListParams,
  MechanicUpdateRepairJobInput,
  UpdateRepairJobInput,
} from "../types/job";

export const jobKeys = {
  all: ["jobs"] as const,

  lists: () => [...jobKeys.all, "list"] as const,

  list: (params: JobListParams) => [...jobKeys.lists(), params] as const,

  details: () => [...jobKeys.all, "detail"] as const,

  detail: (jobId: string) => [...jobKeys.details(), jobId] as const,

  myJobs: () => [...jobKeys.all, "my"] as const,

  myJobList: (
    params: Pick<
      JobListParams,
      "page" | "limit" | "search" | "status" | "priority"
    >,
  ) => [...jobKeys.myJobs(), params] as const,

  parts: (jobId: string) => [...jobKeys.all, "parts", jobId] as const,
};

export const useJobs = (params: JobListParams = {}) => {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => getJobs(params),
  });
};

export const useJob = (jobId: string | null) => {
  return useQuery({
    queryKey: jobId ? jobKeys.detail(jobId) : jobKeys.details(),

    queryFn: () => getJobById(jobId as string),

    enabled: Boolean(jobId),
  });
};

export const useMyJobs = (
  params: Pick<
    JobListParams,
    "page" | "limit" | "search" | "status" | "priority"
  > = {},
) => {
  return useQuery({
    queryKey: jobKeys.myJobList(params),
    queryFn: () => getMyJobs(params),
  });
};

export const useJobParts = (jobId: string | null) => {
  return useQuery({
    queryKey: jobId ? jobKeys.parts(jobId) : [...jobKeys.all, "parts"],

    queryFn: () => getJobParts(jobId as string),

    enabled: Boolean(jobId),
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRepairJobInput) => createJob(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: jobKeys.myJobs(),
      });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      data: UpdateRepairJobInput;
    }) => updateJob(jobId, data),

    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: jobKeys.myJobs(),
      });

      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);
    },
  });
};

export const useUpdateJobAsMechanic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      data: MechanicUpdateRepairJobInput;
    }) => updateJobAsMechanic(jobId, data),

    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: jobKeys.myJobs(),
      });

      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => deleteJob(jobId),

    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: jobKeys.myJobs(),
      });

      queryClient.removeQueries({
        queryKey: jobKeys.detail(jobId),
      });
    },
  });
};

export const useAddJobPart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: AddJobPartInput }) =>
      addJobPart(jobId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(variables.jobId),
      });

      queryClient.invalidateQueries({
        queryKey: jobKeys.parts(variables.jobId),
      });
    },
  });
};

export const useAddJobParts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: AddJobPartsInput }) =>
      addJobParts(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.parts(variables.jobId),
      });
    },
  });
};

export const useRemoveJobPart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, jobPartId }: { jobId: string; jobPartId: string }) =>
      removeJobPart(jobId, jobPartId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(variables.jobId),
      });

      queryClient.invalidateQueries({
        queryKey: jobKeys.parts(variables.jobId),
      });
    },
  });
};
