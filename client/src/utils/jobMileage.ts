export const resolveJobMileageIn = (
  vehicleMileage: number | null | undefined,
  currentMileageIn?: number | null,
): number | undefined => {
  if (currentMileageIn !== undefined && currentMileageIn !== null) {
    return currentMileageIn;
  }

  if (vehicleMileage !== null && vehicleMileage !== undefined) {
    return vehicleMileage;
  }

  return undefined;
};
