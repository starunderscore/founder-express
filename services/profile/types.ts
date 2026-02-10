export type EmployeeProfile = {
  id: string;
  email?: string;
  name?: string;
  displayName?: string;
  dateOfBirth?: string;
  // other fields are ignored by this service
};

export type EmployeeProfilePatch = {
  name?: string;
  displayName?: string;
  dateOfBirth?: string;
};
