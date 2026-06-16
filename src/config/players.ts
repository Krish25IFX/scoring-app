/**
 * Hardcoded captain data with their available players.
 * Each captain has a password and a list of players they can select from.
 * Note: Captain can also play in the match.
 */
export interface Captain {
  id: string;
  name: string;
  password: string;
  players: string[];
}

export const CAPTAINS: Captain[] = [
  {
    id: 'captain1',
    name: 'Captain 1',
    password: 'pass123',
    players: ['Alice', 'Bob', 'Charlie', 'David', 'Emma'],
  },
  {
    id: 'captain2',
    name: 'Captain 2',
    password: 'pass124',
    players: ['Alice', 'Bob', 'Frank', 'Grace', 'Henry'],
  },
  {
    id: 'captain3',
    name: 'Captain 3',
    password: 'pass456',
    players: ['Frank', 'Grace', 'Henry', 'Isla', 'Jack'],
  },
  {
    id: 'captain4',
    name: 'Captain 4',
    password: 'pass457',
    players: ['Charlie', 'David', 'Isla', 'Jack', 'Emma'],
  },
];

/**
 * Hardcoded player roster.
 * Edit this list to add, remove, or rename players.
 */
export const PLAYERS: string[] = [
  'Alice',
  'Bob',
  'Charlie',
  'David',
  'Emma',
  'Frank',
  'Grace',
  'Henry',
  'Isla',
  'Jack',
];

/**
 * PIN required to access the operator/setup pages.
 * Change this value to update the access PIN.
 */
export const OPERATOR_PIN = '2508';
