export enum Status {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}

export const StatusLabel = new Map<Status, string>([
  [Status.Pending, 'Pending'],
  [Status.Accepted, 'Accepted'],
  [Status.Rejected, 'Rejected'],
]);
