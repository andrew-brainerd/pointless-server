export interface Points {
  [userId: string]: number
}

export interface Pool {
  _id: string,
  name: string,
  users: Array<string>
  wagers: Array<Wager>,
  activeWagers?: Array<Wager>,
  inactiveWagers?: Array<Wager>,
  completedWagers?: Array<Wager>,
  pointTotals: Points,
  startingPoints: Points,
  pendingPoints: Points
}

export interface PoolsRequest {
  userEmail: string
}

export interface Wager {
  _id?: string,
  amount: number,
  description: string,
  users: Array<string>,
  activeUsers: Array<string>,
  createdBy: string,
  isActive: boolean,
  isComplete: boolean,
  winners: Array<string>
}

export interface WagerAddition {
  wagers: Wager
}
