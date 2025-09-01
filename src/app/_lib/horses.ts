export type Horse = {
  name: string;
  age: number;
  breed: string;
  location: string;
  gender: "Mare" | "Stallion" | "Gelding";
  heightCm: number;
  description: string;
  color?: string;
  temperament?: string;
  disciplines: string[];
  interests: string[];
  image: string;
  photos?: string[];
};

// Small local dataset to run the app without a DB
export const mockHorses: Horse[] = [
  {
    name: "Starfire",
    age: 6,
    breed: "Thoroughbred",
    location: "Rotterdam, NL",
    gender: "Mare",
    heightCm: 160,
    description: "Speedy and curious. Loves beach gallops and carrots.",
    color: "Bay",
    temperament: "Energetic",
    disciplines: ["Jumping", "Eventing"],
    interests: ["Beach rides", "Groundwork"],
    image: "/TFH/Tinder-for-Horses-cover-image.png",
    photos: [
      "/TFH/horse_on_a_hike.png",
      "/TFH/horse_partying.png",
      "/TFH/horse_holding_a_fish.png",
    ],
  },
  {
    name: "Copper",
    age: 8,
    breed: "Quarter Horse",
    location: "Austin, US",
    gender: "Gelding",
    heightCm: 155,
    description: "Chill trail buddy with a knack for selfies.",
    color: "Chestnut",
    temperament: "Calm",
    disciplines: ["Trail", "Western"],
    interests: ["Snacks", "Creek crossings"],
    image: "/TFH/horse_on_beach_holiday_south_europe.png",
    photos: [
      "/TFH/horse_in_a_gym.png",
      "/TFH/horse_partying.png",
    ],
  },
];

// Original components expect a named export `horses`
export const horses: Horse[] = mockHorses;
