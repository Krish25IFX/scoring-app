/**
 * Hardcoded captain data with their available players.
 * Each captain has a password and a list of players they can select from.
 * Note: Captain can also play in the match.
 */
export interface Captain {
  id: string;
  name: string;
  teamName: string;
  password: string;
  players: string[];
}

export const CAPTAINS: Captain[] = [
  {
    id: 'captain1',
    name: 'Shubham Bhatt',
    teamName: 'Hawa Bazz',
    password: 'shubham123',
    players: ['Shubham Bhatt', 'Deepak Choudhary', 'Kalani Karteek', 'Rohan Patel', 'Tigunait Anchal AvdheshF', 'Yogesh Gusain', 'Pranavkumar Badgujar', 'Sandip Kanzariya', 'Nevil Sutaria', 'Chirag Modi' , 'Karan Rajendrakumar Patel' , 'Zankat Nensee KeeshorbhaiF' ],
  },
  {
    id: 'captain2',
    name: 'Abhishek Chhajer',
    teamName: 'RACKET ROMEO',
    password: 'abhishek123',
    players: ['Suvam Panda', 'Kotikalapudi Jayasurya', 'Anishkumar Anilkumar Nair', 'Shivani ThakurF', 'Gideon Sahoo', 'Devansh Alkeshbhai Shah', 'Dhanush Darshan S A', 'Harshit Joshi', 'Aarav Kansara', 'Prem Bhoot' , 'Siddhi ShahF', 'Chirag Kajar' , 'Abhishek Chhajer'],
  },
  {
    id: 'captain3',
    name: 'Naman Sharma',
    teamName: 'The feather ninjas',
    password: 'naman123',
    players: ['Naman Sharma', 'Darshil Shah', 'Sudhanshu Billore', 'Sandip Rathore', 'Shaashank Chudasama', 'HritikaF', 'Akash Sharma', 'Pulkit Gupta', 'Pagdhal IshaF', 'Joy Gajjar', 'Harsh Arora', 'Nikhil Goyal'],
  },
  {
    id: 'captain4',
    name: 'Meet Dholariya',
    teamName: 'The Shuttle Force',
    password: 'meet123',
    players: ['Meet Dholariya', 'Dave Anil', 'Simran RasdhariF', 'Rohit Parmar', 'Jugal gandhi', 'Vikram', 'Mayank Prajapati', 'yash Mewada', 'Anmol Pandey', 'Maulik Kanakiya', 'Richa SharmaF', 'Nikhil Shrivastava'],
  },
  {
    id: 'captain5',
    name: 'Praveen Pochina',
    teamName: 'Flick and Smash',
    password: 'praveen123',
    players: ['Praveen Pochina', 'Tanjil Ghanchi', 'Aryan Gauravkumar', 'Prerak Dalia', 'Dhruti DesaiF', 'Sakshi GoyalF', 'harsh Pandya', 'Prabhash sharma' , 'Rajit Joshi' , 'Varmora Jigar' , 'Kaushal Dhora', 'Panchal Ajitkumar'],
  },
  {
    id: 'captain6',
    name: 'Shubham Gupta',
    teamName: 'Team Zeta',
    password: 'zeta123',
    players: ['Shubham Gupta', 'hari babu', 'Amisha SoniF', 'Dhairya Limbachiya', 'Shilp Patel', 'Henil Shah', 'Ria KangariwalaF', 'Raj Patel', 'Divyesh patel', 'Gunjan Seth' , 'Krish Viramgam (App Owner)' , 'Tanmay Rathod' , 'Dhriti DeyF'],
  },
];

/** All team names for standings */
export const TEAM_NAMES: string[] = CAPTAINS.map((c) => c.teamName);

/**
 * PIN required to access the operator/setup pages.
 * Change this value to update the access PIN.
 */
export const OPERATOR_PIN = '2508';

/**
 * Walkover score: points given to the team when the opponent cannot play.
 */
export const WALKOVER_POINTS = 22;
