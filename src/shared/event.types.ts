export interface EventRecord {
  id: number;
  levelId: number;
  levelLabel: string;
  eventDate: string;
  location: string;
  title: string;
  createdAt: string;
}

export interface EventInput {
  levelId: number;
  eventDate: string;
  location: string;
  title: string;
}
