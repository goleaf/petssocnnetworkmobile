import type {
  User,
  Pet,
  BlogPost,
  Comment,
  WikiArticle,
  Group,
  GroupMember,
  GroupTopic,
  GroupPoll,
  PollVote,
  GroupEvent,
  EventRSVP,
  GroupResource,
  GroupCategory
} from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    email: "sarah@example.com",
    username: "sarahpaws",
    password: "password123",
    fullName: "Sarah Johnson",
    role: "admin",
    avatar: "/woman-and-loyal-companion.png",
    bio: "Dog mom to two golden retrievers. Love hiking and outdoor adventures!",
    location: "San Francisco, CA",
    joinedAt: "2024-01-15",
    followers: ["2", "3", "5", "6", "7", "8", "9", "10"],
    following: ["2", "4", "5", "6", "7", "8"],
    willingToAdopt: "yes",
    preferredPetSize: "large",
    trainingStyle: "positive-reinforcement",
    breedPreferences: "Golden Retriever, Labrador Retriever, German Shepherd",
    activityLevelPreference: "high",
    energyLevelPreference: "high",
    groomingNeedsPreference: "moderate",
    exerciseNeedsPreference: "very-high",
    agePreference: "any",
    healthStatusPreference: "minor-issues",
    specialNeedsAcceptance: "maybe",
    temperamentPreference: "energetic",
    livingSpacePreference: "both",
    playStylePreference: "rough",
    feedingSchedulePreference: "scheduled",
    socializationPreference: "very-social",
  },
  {
    id: "2",
    email: "mike@example.com",
    username: "mikecatlover",
    password: "password123",
    fullName: "Mike Chen",
    role: "moderator",
    avatar: "/man-and-cat.png",
    bio: "Cat enthusiast and photographer. Sharing my cats daily adventures.",
    location: "New York, NY",
    joinedAt: "2024-02-20",
    followers: ["1", "3", "4"],
    following: ["1", "3"],
  },
  {
    id: "3",
    email: "emma@example.com",
    username: "emmabirds",
    password: "password123",
    fullName: "Emma Wilson",
    avatar: "/woman-with-bird.jpg",
    bio: "Parrot parent and avian behavior specialist.",
    location: "Austin, TX",
    joinedAt: "2024-03-10",
    followers: ["1", "2", "4"],
    following: ["2"],
  },
  {
    id: "4",
    email: "alex@example.com",
    username: "alexrabbits",
    password: "password123",
    fullName: "Alex Martinez",
    avatar: "/person-with-rabbit.jpg",
    bio: "Rabbit rescue volunteer. Educating about proper bunny care.",
    location: "Portland, OR",
    joinedAt: "2024-01-05",
    followers: ["1", "2", "3"],
    following: ["1", "2", "3"],
  },
  {
    id: "5",
    email: "jessica@example.com",
    username: "jessicadogs",
    password: "password123",
    fullName: "Jessica Thompson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
    bio: "Proud owner of three rescue dogs. Animal welfare advocate.",
    location: "Seattle, WA",
    joinedAt: "2024-02-01",
    followers: ["1", "6", "7"],
    following: ["1"],
  },
  {
    id: "6",
    email: "david@example.com",
    username: "davidcats",
    password: "password123",
    fullName: "David Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    bio: "Cat lover and professional pet photographer.",
    location: "Boston, MA",
    joinedAt: "2024-02-15",
    followers: ["1", "5", "8"],
    following: ["1", "5"],
  },
  {
    id: "7",
    email: "lisa@example.com",
    username: "lisapets",
    password: "password123",
    fullName: "Lisa Anderson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    bio: "Multi-pet household enthusiast. Dogs, cats, and birds!",
    location: "Chicago, IL",
    joinedAt: "2024-01-20",
    followers: ["1", "5", "9"],
    following: ["1"],
  },
  {
    id: "8",
    email: "robert@example.com",
    username: "robertpaws",
    password: "password123",
    fullName: "Robert Taylor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    bio: "Dog trainer and behaviorist. Helping dogs live their best lives.",
    location: "Denver, CO",
    joinedAt: "2024-03-01",
    followers: ["1", "6", "10"],
    following: ["1", "6"],
  },
  {
    id: "9",
    email: "sophia@example.com",
    username: "sophiapets",
    password: "password123",
    fullName: "Sophia Garcia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    bio: "Veterinarian and pet health educator. Sharing pet care tips daily.",
    location: "Miami, FL",
    joinedAt: "2024-02-10",
    followers: ["1", "7", "10"],
    following: ["1"],
  },
  {
    id: "10",
    email: "james@example.com",
    username: "jamesfurry",
    password: "password123",
    fullName: "James Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    bio: "Pet adoption advocate. Forever home finder for rescue animals.",
    location: "Phoenix, AZ",
    joinedAt: "2024-01-25",
    followers: ["1", "8", "9"],
    following: ["1"],
  },
  {
    id: "11",
    email: "olivia@example.com",
    username: "oliviapets",
    password: "password123",
    fullName: "Olivia Davis",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia",
    bio: "Passionate about animal rescue and rehabilitation. Sharing stories of hope!",
    location: "Los Angeles, CA",
    joinedAt: "2024-02-05",
    followers: [],
    following: [],
  },
  {
    id: "12",
    email: "william@example.com",
    username: "williamdogs",
    password: "password123",
    fullName: "William Miller",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=William",
    bio: "Dog trainer specializing in behavioral issues. Transforming lives one paw at a time.",
    location: "Houston, TX",
    joinedAt: "2024-02-12",
    followers: [],
    following: [],
  },
  {
    id: "13",
    email: "ava@example.com",
    username: "avacats",
    password: "password123",
    fullName: "Ava Jackson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ava",
    bio: "Cat behavior consultant and proud owner of four rescue cats. Feline advocate!",
    location: "Philadelphia, PA",
    joinedAt: "2024-02-18",
    followers: [],
    following: [],
  },
  {
    id: "14",
    email: "henry@example.com",
    username: "henrybirds",
    password: "password123",
    fullName: "Henry White",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Henry",
    bio: "Avian enthusiast and parrot behaviorist. Educating about proper bird care.",
    location: "San Antonio, TX",
    joinedAt: "2024-02-22",
    followers: [],
    following: [],
  },
  {
    id: "15",
    email: "isabella@example.com",
    username: "isabellapaws",
    password: "password123",
    fullName: "Isabella Harris",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella",
    bio: "Small dog enthusiast. Yorkie mom of two!",
    location: "San Diego, CA",
    joinedAt: "2024-03-01",
    followers: [],
    following: [],
  },
  {
    id: "16",
    email: "noah@example.com",
    username: "noahfurry",
    password: "password123",
    fullName: "Noah Martin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
    bio: "Veterinary technician sharing daily pet care tips and tricks.",
    location: "Dallas, TX",
    joinedAt: "2024-03-05",
    followers: [],
    following: [],
  },
  {
    id: "17",
    email: "sophia@example.com",
    username: "sophiarabbits",
    password: "password123",
    fullName: "Sophia Thompson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia2",
    bio: "Rabbit rescue coordinator. Dedicated to finding forever homes for bunnies.",
    location: "San Jose, CA",
    joinedAt: "2024-03-08",
    followers: [],
    following: [],
  },
  {
    id: "18",
    email: "mason@example.com",
    username: "masonpets",
    password: "password123",
    fullName: "Mason Garcia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mason",
    bio: "Large breed dog lover. Sharing adventures with my Great Dane!",
    location: "Austin, TX",
    joinedAt: "2024-03-12",
    followers: [],
    following: [],
  },
  {
    id: "19",
    email: "mia@example.com",
    username: "miacats",
    password: "password123",
    fullName: "Mia Martinez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
    bio: "Cat photographer and behaviorist. Capturing feline personalities!",
    location: "Jacksonville, FL",
    joinedAt: "2024-03-15",
    followers: [],
    following: [],
  },
  {
    id: "20",
    email: "ethan@example.com",
    username: "ethandogs",
    password: "password123",
    fullName: "Ethan Robinson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan",
    bio: "Dog agility competitor and trainer. Pushing limits with my Border Collie!",
    location: "Columbus, OH",
    joinedAt: "2024-03-18",
    followers: [],
    following: [],
  },
  {
    id: "21",
    email: "amelia@example.com",
    username: "ameliapets",
    password: "password123",
    fullName: "Amelia Clark",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia",
    bio: "Multi-pet household manager. Dogs, cats, and a parrot living in harmony!",
    location: "Charlotte, NC",
    joinedAt: "2024-03-20",
    followers: [],
    following: [],
  },
  {
    id: "22",
    email: "lucas@example.com",
    username: "lucasbirds",
    password: "password123",
    fullName: "Lucas Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas",
    bio: "Parrot parent and avian nutrition specialist. Passionate about bird wellness.",
    location: "Indianapolis, IN",
    joinedAt: "2024-03-22",
    followers: [],
    following: [],
  },
  {
    id: "23",
    email: "harper@example.com",
    username: "harperdogs",
    password: "password123",
    fullName: "Harper Lewis",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Harper",
    bio: "Senior dog advocate. Specializing in care for aging canines.",
    location: "Seattle, WA",
    joinedAt: "2024-03-25",
    followers: [],
    following: [],
  },
  {
    id: "24",
    email: "benjamin@example.com",
    username: "benjamincats",
    password: "password123",
    fullName: "Benjamin Walker",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin",
    bio: "Feline nutrition expert. Helping cats thrive through proper diet.",
    location: "Denver, CO",
    joinedAt: "2024-03-28",
    followers: [],
    following: [],
  },
  {
    id: "25",
    email: "evelyn@example.com",
    username: "evelynpaws",
    password: "password123",
    fullName: "Evelyn Hall",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn",
    bio: "Puppy trainer and early socialization specialist. Setting pups up for success!",
    location: "Boston, MA",
    joinedAt: "2024-04-01",
    followers: [],
    following: [],
  },
  {
    id: "26",
    email: "alexander@example.com",
    username: "alexanderpets",
    password: "password123",
    fullName: "Alexander Allen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander",
    bio: "Animal shelter volunteer. Finding homes for pets in need.",
    location: "El Paso, TX",
    joinedAt: "2024-04-03",
    followers: [],
    following: [],
  },
  {
    id: "27",
    email: "abigail@example.com",
    username: "abigailrabbits",
    password: "password123",
    fullName: "Abigail Young",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abigail",
    bio: "Rabbit care educator. Spreading knowledge about proper bunny care.",
    location: "Nashville, TN",
    joinedAt: "2024-04-05",
    followers: [],
    following: [],
  },
  {
    id: "28",
    email: "daniel@example.com",
    username: "danieldogs",
    password: "password123",
    fullName: "Daniel King",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel",
    bio: "Service dog trainer. Transforming lives through canine partnerships.",
    location: "Detroit, MI",
    joinedAt: "2024-04-08",
    followers: [],
    following: [],
  },
  {
    id: "29",
    email: "emily@example.com",
    username: "emilycats",
    password: "password123",
    fullName: "Emily Wright",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    bio: "Cat groomer and behavior consultant. Making cats feel their best!",
    location: "Portland, OR",
    joinedAt: "2024-04-10",
    followers: [],
    following: [],
  },
  {
    id: "30",
    email: "matthew@example.com",
    username: "matthewbirds",
    password: "password123",
    fullName: "Matthew Lopez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Matthew",
    bio: "Exotic bird breeder and trainer. Specializing in rare species.",
    location: "Oklahoma City, OK",
    joinedAt: "2024-04-12",
    followers: [],
    following: [],
  },
  {
    id: "31",
    email: "chloe@example.com",
    username: "chloepaws",
    password: "password123",
    fullName: "Chloe Hill",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
    bio: "Therapy dog handler. Bringing comfort to those in need.",
    location: "Las Vegas, NV",
    joinedAt: "2024-04-15",
    followers: [],
    following: [],
  },
  {
    id: "32",
    email: "andrew@example.com",
    username: "andrewpets",
    password: "password123",
    fullName: "Andrew Scott",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andrew",
    bio: "Pet nutritionist. Creating custom meal plans for optimal health.",
    location: "Louisville, KY",
    joinedAt: "2024-04-18",
    followers: [],
    following: [],
  },
  {
    id: "33",
    email: "madison@example.com",
    username: "madisoncats",
    password: "password123",
    fullName: "Madison Green",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Madison",
    bio: "Cat rescue coordinator. Saving lives one feline at a time.",
    location: "Baltimore, MD",
    joinedAt: "2024-04-20",
    followers: [],
    following: [],
  },
  {
    id: "34",
    email: "joshua@example.com",
    username: "joshuadogs",
    password: "password123",
    fullName: "Joshua Adams",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joshua",
    bio: "Working dog handler. Training detection and protection dogs.",
    location: "Milwaukee, WI",
    joinedAt: "2024-04-22",
    followers: [],
    following: [],
  },
  {
    id: "35",
    email: "grace@example.com",
    username: "gracepets",
    password: "password123",
    fullName: "Grace Baker",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
    bio: "Pet photographer. Capturing beautiful moments between pets and owners.",
    location: "Albuquerque, NM",
    joinedAt: "2024-04-25",
    followers: [],
    following: [],
  },
  {
    id: "36",
    email: "ryan@example.com",
    username: "ryanbirds",
    password: "password123",
    fullName: "Ryan Nelson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan",
    bio: "Avian veterinarian assistant. Caring for our feathered friends!",
    location: "Tucson, AZ",
    joinedAt: "2024-04-27",
    followers: [],
    following: [],
  },
  {
    id: "37",
    email: "lily@example.com",
    username: "lilydogs",
    password: "password123",
    fullName: "Lily Carter",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
    bio: "Rescue dog advocate. Documenting transformation stories.",
    location: "Fresno, CA",
    joinedAt: "2024-04-30",
    followers: [],
    following: [],
  },
  {
    id: "38",
    email: "nathan@example.com",
    username: "nathanpets",
    password: "password123",
    fullName: "Nathan Mitchell",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nathan",
    bio: "Pet behavior analyst. Understanding what our pets are really saying.",
    location: "Mesa, AZ",
    joinedAt: "2024-05-02",
    followers: [],
    following: [],
  },
  {
    id: "39",
    email: "zoey@example.com",
    username: "zoeycats",
    password: "password123",
    fullName: "Zoey Perez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoey",
    bio: "Foster cat mom. Temporary homes leading to forever families.",
    location: "Sacramento, CA",
    joinedAt: "2024-05-05",
    followers: [],
    following: [],
  },
  {
    id: "40",
    email: "carter@example.com",
    username: "carterdogs",
    password: "password123",
    fullName: "Carter Roberts",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carter",
    bio: "Dog sports enthusiast. Competing in agility and flyball!",
    location: "Atlanta, GA",
    joinedAt: "2024-05-08",
    followers: [],
    following: [],
  },
]

export const mockPets: Pet[] = [
  {
    id: "1",
    ownerId: "1",
    name: "Max",
    species: "dog",
    breed: "Golden Retriever",
    age: 3,
    gender: "male",
    avatar: "/golden-retriever.png",
    bio: "Loves fetch, swimming, and making new friends at the park!",
    birthday: "2021-05-12",
    weight: "70 lbs",
    color: "Golden",
    followers: ["2", "3", "4"],
    microchipId: "985112001234567",
    spayedNeutered: true,
    adoptionDate: "2021-06-15",
    photos: [
      "/golden-retriever.png",
      "/golden-retriever-beach.png",
      "/dog-agility-course.png",
      "/golden-retriever-playing.png",
      "/golden-retriever-swimming.jpg",
      "/golden-retriever-sleeping.png",
    ],
    friends: ["2", "3"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Energetic", "Friendly", "Loyal", "Playful", "Social"],
    },
    favoriteThings: {
      toys: ["Tennis Ball", "Rope Toy", "Frisbee"],
      activities: ["Swimming", "Fetch", "Hiking", "Meeting new dogs"],
      places: ["Dog Park", "Beach", "Lake"],
      foods: ["Chicken", "Peanut Butter", "Carrots"],
    },
    dietInfo: {
      foodBrand: "Blue Buffalo Life Protection",
      foodType: "Dry Kibble (Adult Large Breed)",
      portionSize: "3 cups per day",
      feedingSchedule: ["8:00 AM - 1.5 cups", "6:00 PM - 1.5 cups"],
      treats: ["Training treats", "Dental chews"],
      restrictions: ["No chicken bones", "No grapes"],
    },
    allergies: ["Corn", "Soy"],
    healthRecords: [
      {
        id: "hr1",
        date: "2024-11-15",
        type: "checkup",
        title: "Annual Wellness Exam",
        description:
          "Complete physical examination. All vitals normal. Weight stable at 70 lbs. Teeth in good condition. Recommended dental cleaning in 6 months.",
        veterinarian: "Dr. Sarah Mitchell",
      },
      {
        id: "hr2",
        date: "2023-08-20",
        type: "injury",
        title: "Minor Paw Laceration",
        description:
          "Small cut on right front paw from broken glass at park. Cleaned and bandaged. Prescribed antibiotics for 7 days. Healed completely.",
        veterinarian: "Dr. Sarah Mitchell",
      },
      {
        id: "hr3",
        date: "2022-03-10",
        type: "surgery",
        title: "Neutering Surgery",
        description: "Routine neutering procedure completed successfully. Recovery was smooth with no complications.",
        veterinarian: "Dr. James Wilson",
      },
    ],
    vaccinations: [
      {
        id: "v1",
        name: "Rabies",
        date: "2023-11-15",
        nextDue: "2026-11-15",
        veterinarian: "Dr. Sarah Mitchell",
        batchNumber: "RAB-2023-1145",
      },
      {
        id: "v2",
        name: "DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus)",
        date: "2024-11-15",
        nextDue: "2025-11-15",
        veterinarian: "Dr. Sarah Mitchell",
        batchNumber: "DHPP-2024-8892",
      },
      {
        id: "v3",
        name: "Bordetella",
        date: "2024-11-15",
        nextDue: "2025-05-15",
        veterinarian: "Dr. Sarah Mitchell",
        batchNumber: "BOR-2024-3341",
      },
    ],
    medications: [
      {
        id: "m1",
        name: "Heartgard Plus",
        dosage: "51-100 lbs tablet",
        frequency: "Once monthly",
        startDate: "2021-06-15",
        prescribedBy: "Dr. Sarah Mitchell",
        notes: "Heartworm prevention - given on the 1st of each month",
      },
      {
        id: "m2",
        name: "NexGard",
        dosage: "60.1-121 lbs chewable",
        frequency: "Once monthly",
        startDate: "2021-06-15",
        prescribedBy: "Dr. Sarah Mitchell",
        notes: "Flea and tick prevention - given on the 15th of each month",
      },
    ],
    trainingProgress: [
      {
        id: "t1",
        skill: "Basic Obedience (Sit, Stay, Down, Come)",
        level: "mastered",
        startedAt: "2021-07-01",
        completedAt: "2021-09-15",
        notes: "Completed puppy training class with excellent results",
      },
      {
        id: "t2",
        skill: "Leash Walking",
        level: "mastered",
        startedAt: "2021-07-01",
        completedAt: "2021-10-01",
        notes: "No longer pulls on leash, walks calmly beside owner",
      },
      {
        id: "t3",
        skill: "Advanced Tricks (Roll Over, Play Dead, Speak)",
        level: "advanced",
        startedAt: "2022-01-10",
        completedAt: "2022-06-20",
        notes: "Loves learning new tricks, very food motivated",
      },
      {
        id: "t4",
        skill: "Agility Training",
        level: "intermediate",
        startedAt: "2024-03-01",
        notes: "Currently working on weave poles and A-frame. Shows great enthusiasm!",
      },
    ],
    achievements: [
      {
        id: "a1",
        title: "Good Boy Graduate",
        description: "Completed Basic Obedience Training",
        icon: "🎓",
        earnedAt: "2021-09-15",
      },
      {
        id: "a2",
        title: "Social Butterfly",
        description: "Made 50+ dog friends at the park",
        icon: "🦋",
        earnedAt: "2022-05-20",
      },
      {
        id: "a3",
        title: "Swimming Champion",
        description: "Swam 100 meters without stopping",
        icon: "🏊",
        earnedAt: "2023-07-04",
      },
      {
        id: "a4",
        title: "Therapy Dog Certified",
        description: "Passed therapy dog certification",
        icon: "❤️",
        earnedAt: "2024-02-14",
      },
    ],
    vetInfo: {
      clinicName: "Paws & Claws Veterinary Hospital",
      veterinarianName: "Dr. Sarah Mitchell, DVM",
      phone: "(555) 123-4567",
      address: "123 Pet Care Lane, San Francisco, CA 94102",
      emergencyContact: "(555) 123-4568 (24/7 Emergency Line)",
    },
    insurance: {
      provider: "Healthy Paws Pet Insurance",
      policyNumber: "HP-2021-789456",
      coverage: "Comprehensive (Accidents, Illnesses, Hereditary Conditions)",
      expiryDate: "2025-06-15",
    },
  },
  {
    id: "2",
    ownerId: "1",
    name: "Luna",
    species: "dog",
    breed: "Golden Retriever",
    age: 2,
    gender: "female",
    avatar: "/golden-retriever-puppy.png",
    bio: "Max's little sister. Energetic and always ready to play!",
    birthday: "2022-08-20",
    weight: "60 lbs",
    color: "Light Golden",
    followers: ["2", "3"],
    microchipId: "985112007654321",
    spayedNeutered: true,
    adoptionDate: "2022-10-01",
    photos: [
      "/golden-retriever-puppy.png",
      "/dog-agility-course.png",
      "/golden-retriever-puppy-playing.jpg",
      "/golden-retriever-running.png",
    ],
    friends: ["1", "3"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 5,
      playfulness: 5,
      independence: 2,
      traits: ["Energetic", "Smart", "Eager to Please", "Playful"],
    },
    favoriteThings: {
      toys: ["Squeaky Ball", "Tug Rope", "Puzzle Toys"],
      activities: ["Agility Training", "Fetch", "Learning Tricks"],
      places: ["Agility Course", "Dog Park"],
      foods: ["Salmon", "Sweet Potato", "Blueberries"],
    },
    dietInfo: {
      foodBrand: "Blue Buffalo Life Protection",
      foodType: "Dry Kibble (Adult Large Breed)",
      portionSize: "2.5 cups per day",
      feedingSchedule: ["8:00 AM - 1.25 cups", "6:00 PM - 1.25 cups"],
      treats: ["Training treats", "Frozen blueberries"],
    },
    healthRecords: [
      {
        id: "hr4",
        date: "2024-10-20",
        type: "checkup",
        title: "Annual Wellness Exam",
        description: "Healthy and active. All vaccinations up to date. Weight appropriate for age and breed.",
        veterinarian: "Dr. Sarah Mitchell",
      },
    ],
    vaccinations: [
      {
        id: "v4",
        name: "Rabies",
        date: "2023-10-20",
        nextDue: "2026-10-20",
        veterinarian: "Dr. Sarah Mitchell",
      },
      {
        id: "v5",
        name: "DHPP",
        date: "2024-10-20",
        nextDue: "2025-10-20",
        veterinarian: "Dr. Sarah Mitchell",
      },
    ],
    medications: [
      {
        id: "m3",
        name: "Heartgard Plus",
        dosage: "26-50 lbs tablet",
        frequency: "Once monthly",
        startDate: "2022-10-01",
        prescribedBy: "Dr. Sarah Mitchell",
      },
    ],
    trainingProgress: [
      {
        id: "t5",
        skill: "Basic Obedience",
        level: "mastered",
        startedAt: "2022-11-01",
        completedAt: "2023-02-15",
      },
      {
        id: "t6",
        skill: "Agility Training",
        level: "advanced",
        startedAt: "2024-01-10",
        notes: "Natural talent! Excelling in all obstacles.",
      },
    ],
    achievements: [
      {
        id: "a5",
        title: "Quick Learner",
        description: "Mastered 10 commands in first month",
        icon: "⚡",
        earnedAt: "2022-12-01",
      },
      {
        id: "a6",
        title: "Agility Star",
        description: "First place in beginner agility competition",
        icon: "⭐",
        earnedAt: "2024-06-15",
      },
    ],
    vetInfo: {
      clinicName: "Paws & Claws Veterinary Hospital",
      veterinarianName: "Dr. Sarah Mitchell, DVM",
      phone: "(555) 123-4567",
      address: "123 Pet Care Lane, San Francisco, CA 94102",
    },
  },
  {
    id: "3",
    ownerId: "2",
    name: "Whiskers",
    species: "cat",
    breed: "Maine Coon",
    age: 4,
    gender: "male",
    avatar: "/maine-coon-cat.png",
    bio: "Majestic floof who rules the house. Loves naps and treats.",
    birthday: "2020-03-15",
    weight: "18 lbs",
    color: "Brown Tabby",
    followers: ["1", "3", "4"],
    microchipId: "985112009876543",
    spayedNeutered: true,
    photos: [
      "/maine-coon-cat.png",
      "/cat-in-box.jpg",
      "/maine-coon-cat-lounging.jpg",
      "/maine-coon-portrait.png",
      "/fluffy-cat-sleeping.jpg",
    ],
    friends: ["4"],
    personality: {
      energyLevel: 2,
      friendliness: 4,
      trainability: 3,
      playfulness: 3,
      independence: 4,
      traits: ["Calm", "Gentle", "Affectionate", "Majestic", "Lazy"],
    },
    favoriteThings: {
      toys: ["Feather Wand", "Catnip Mouse", "Cardboard Boxes"],
      activities: ["Napping", "Bird Watching", "Being Brushed"],
      places: ["Window Sill", "Cat Tower", "Sunny Spots"],
      foods: ["Tuna", "Chicken", "Temptations Treats"],
    },
    dietInfo: {
      foodBrand: "Royal Canin Maine Coon Adult",
      foodType: "Dry Kibble",
      portionSize: "1 cup per day",
      feedingSchedule: ["7:00 AM - 0.5 cups", "7:00 PM - 0.5 cups"],
      treats: ["Temptations", "Freeze-dried chicken"],
      restrictions: ["Dairy products"],
    },
    allergies: ["Dairy"],
    healthRecords: [
      {
        id: "hr5",
        date: "2024-09-10",
        type: "checkup",
        title: "Annual Wellness Exam",
        description:
          "Healthy Maine Coon. Slight weight gain noted, recommend portion control. Dental cleaning scheduled.",
        veterinarian: "Dr. Emily Rodriguez",
      },
      {
        id: "hr6",
        date: "2024-09-25",
        type: "other",
        title: "Dental Cleaning",
        description:
          "Professional dental cleaning performed under anesthesia. Two teeth extracted due to resorption. Recovery smooth.",
        veterinarian: "Dr. Emily Rodriguez",
      },
    ],
    vaccinations: [
      {
        id: "v6",
        name: "FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)",
        date: "2024-03-15",
        nextDue: "2027-03-15",
        veterinarian: "Dr. Emily Rodriguez",
      },
      {
        id: "v7",
        name: "Rabies",
        date: "2024-03-15",
        nextDue: "2027-03-15",
        veterinarian: "Dr. Emily Rodriguez",
      },
    ],
    medications: [
      {
        id: "m4",
        name: "Revolution Plus",
        dosage: "11.1-22 lbs",
        frequency: "Once monthly",
        startDate: "2020-04-01",
        prescribedBy: "Dr. Emily Rodriguez",
        notes: "Flea, tick, heartworm, and intestinal parasite prevention",
      },
    ],
    achievements: [
      {
        id: "a7",
        title: "Gentle Giant",
        description: "Known for being the calmest cat at the vet",
        icon: "😌",
        earnedAt: "2021-06-10",
      },
      {
        id: "a8",
        title: "Instagram Famous",
        description: "Featured on @mainecoonlovers with 10K likes",
        icon: "📸",
        earnedAt: "2023-11-20",
      },
    ],
    vetInfo: {
      clinicName: "Feline Health Center",
      veterinarianName: "Dr. Emily Rodriguez, DVM",
      phone: "(555) 234-5678",
      address: "456 Cat Street, New York, NY 10001",
    },
  },
  {
    id: "4",
    ownerId: "2",
    name: "Shadow",
    species: "cat",
    breed: "Black Cat",
    age: 5,
    gender: "female",
    avatar: "/black-cat-portrait.png",
    bio: "Mysterious and elegant. Enjoys sunbathing and bird watching.",
    birthday: "2019-10-31",
    weight: "10 lbs",
    color: "Black",
    followers: ["1", "4"],
    microchipId: "985112005555555",
    spayedNeutered: true,
    photos: ["/black-cat-portrait.png", "/black-cat-in-sunlight.jpg", "/black-cat-eyes.jpg"],
    friends: ["3"],
    personality: {
      energyLevel: 3,
      friendliness: 3,
      trainability: 2,
      playfulness: 3,
      independence: 5,
      traits: ["Independent", "Mysterious", "Elegant", "Selective"],
    },
    favoriteThings: {
      toys: ["Laser Pointer", "Crinkle Balls"],
      activities: ["Sunbathing", "Bird Watching", "Midnight Zoomies"],
      places: ["Window Perch", "Under the Bed"],
      foods: ["Salmon", "Tuna"],
    },
    dietInfo: {
      foodBrand: "Wellness CORE Grain-Free",
      foodType: "Wet Food",
      portionSize: "1 can per day",
      feedingSchedule: ["7:00 AM - 0.5 can", "7:00 PM - 0.5 can"],
    },
    healthRecords: [
      {
        id: "hr7",
        date: "2024-10-31",
        type: "checkup",
        title: "Birthday Wellness Check",
        description: "Healthy 5-year-old cat. Maintaining ideal weight. All systems normal.",
        veterinarian: "Dr. Emily Rodriguez",
      },
    ],
    vaccinations: [
      {
        id: "v8",
        name: "FVRCP",
        date: "2024-10-31",
        nextDue: "2027-10-31",
        veterinarian: "Dr. Emily Rodriguez",
      },
    ],
    medications: [
      {
        id: "m5",
        name: "Revolution Plus",
        dosage: "5.6-11 lbs",
        frequency: "Once monthly",
        startDate: "2019-11-15",
        prescribedBy: "Dr. Emily Rodriguez",
      },
    ],
    achievements: [
      {
        id: "a9",
        title: "Night Owl",
        description: "Master of 3 AM zoomies",
        icon: "🌙",
        earnedAt: "2020-01-15",
      },
    ],
    vetInfo: {
      clinicName: "Feline Health Center",
      veterinarianName: "Dr. Emily Rodriguez, DVM",
      phone: "(555) 234-5678",
      address: "456 Cat Street, New York, NY 10001",
    },
  },
  {
    id: "5",
    ownerId: "3",
    name: "Kiwi",
    species: "bird",
    breed: "Green Cheek Conure",
    age: 2,
    gender: "male",
    avatar: "/green-parrot.jpg",
    bio: "Chatty little guy who loves to dance and play with toys!",
    birthday: "2022-06-10",
    color: "Green",
    followers: ["1", "2"],
    photos: ["/green-parrot.jpg", "/parrot-waving.jpg", "/green-cheek-conure-playing.jpg"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Playful", "Vocal", "Affectionate", "Curious", "Social"],
    },
    favoriteThings: {
      toys: ["Bell Toy", "Rope Perch", "Foraging Toys", "Mirror"],
      activities: ["Dancing", "Talking", "Playing with Owner", "Foraging"],
      foods: ["Millet", "Berries", "Pellets"],
    },
    dietInfo: {
      foodBrand: "Harrison's High Potency Fine",
      foodType: "Pellets",
      portionSize: "2 tablespoons per day",
      feedingSchedule: ["8:00 AM - Fresh pellets", "Throughout day - Fresh vegetables"],
      treats: ["Millet spray (limited)", "Fresh berries"],
      restrictions: ["Avocado", "Chocolate", "Salt", "Caffeine"],
    },
    healthRecords: [
      {
        id: "hr8",
        date: "2024-06-10",
        type: "checkup",
        title: "Annual Avian Exam",
        description:
          "Healthy 2-year-old Green Cheek Conure. Beak and nails trimmed. Weight appropriate. Very social and active.",
        veterinarian: "Dr. Lisa Chen, Avian Specialist",
      },
    ],
    trainingProgress: [
      {
        id: "t7",
        skill: "Step Up",
        level: "mastered",
        startedAt: "2022-07-01",
        completedAt: "2022-07-15",
      },
      {
        id: "t8",
        skill: "Wave Hello",
        level: "mastered",
        startedAt: "2024-10-01",
        completedAt: "2024-11-15",
      },
      {
        id: "t9",
        skill: "Ring Bell",
        level: "intermediate",
        startedAt: "2024-11-20",
        notes: "Learning to ring bell on command",
      },
    ],
    achievements: [
      {
        id: "a10",
        title: "First Words",
        description: 'Learned to say "Hello" and "Kiwi"',
        icon: "🗣️",
        earnedAt: "2023-01-20",
      },
      {
        id: "a11",
        title: "Dance Master",
        description: "Dances to music on command",
        icon: "💃",
        earnedAt: "2023-08-15",
      },
    ],
    vetInfo: {
      clinicName: "Avian & Exotic Pet Hospital",
      veterinarianName: "Dr. Lisa Chen, DVM (Avian Specialist)",
      phone: "(555) 345-6789",
      address: "789 Bird Lane, Austin, TX 78701",
    },
  },
  {
    id: "6",
    ownerId: "4",
    name: "Thumper",
    species: "rabbit",
    breed: "Holland Lop",
    age: 1,
    gender: "male",
    avatar: "/lop-rabbit.jpg",
    bio: "Adorable bunny who loves carrots and hopping around!",
    birthday: "2023-04-22",
    weight: "3 lbs",
    color: "White and Brown",
    followers: ["1", "2", "3"],
    spayedNeutered: true,
    photos: ["/lop-rabbit.jpg", "/rabbit-room-setup.jpg", "/holland-lop-rabbit-eating.jpg", "/cute-bunny-hopping.jpg"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 3,
      playfulness: 4,
      independence: 3,
      traits: ["Curious", "Gentle", "Playful", "Social"],
    },
    favoriteThings: {
      toys: ["Willow Ball", "Cardboard Tunnel", "Chew Sticks"],
      activities: ["Binkying", "Exploring", "Being Petted", "Digging"],
      places: ["Free-Roam Room", "Under Furniture"],
      foods: ["Cilantro", "Romaine Lettuce", "Carrots (treats)", "Timothy Hay"],
    },
    dietInfo: {
      foodBrand: "Oxbow Essentials Adult Rabbit Food",
      foodType: "Pellets + Unlimited Timothy Hay",
      portionSize: "1/4 cup pellets per day",
      feedingSchedule: ["Morning - Fresh hay and pellets", "Evening - Fresh vegetables"],
      treats: ["Small piece of carrot", "Apple slice (rare)"],
      restrictions: ["No iceberg lettuce", "No beans", "Limited fruit"],
    },
    specialNeeds: "Requires daily exercise time outside cage (minimum 3-4 hours)",
    healthRecords: [
      {
        id: "hr9",
        date: "2024-04-22",
        type: "checkup",
        title: "First Birthday Checkup",
        description:
          "Healthy 1-year-old Holland Lop. Teeth alignment good. Weight appropriate. Very friendly temperament.",
        veterinarian: "Dr. Mark Thompson, Exotic Animal Specialist",
      },
      {
        id: "hr10",
        date: "2023-08-15",
        type: "surgery",
        title: "Neutering Surgery",
        description: "Routine neutering performed successfully. Recovery excellent with no complications.",
        veterinarian: "Dr. Mark Thompson",
      },
    ],
    trainingProgress: [
      {
        id: "t10",
        skill: "Litter Box Training",
        level: "mastered",
        startedAt: "2023-05-01",
        completedAt: "2023-06-15",
        notes: "99% accuracy with litter box usage",
      },
      {
        id: "t11",
        skill: "Come When Called",
        level: "intermediate",
        startedAt: "2023-07-01",
        notes: "Responds to name when treats are involved",
      },
    ],
    achievements: [
      {
        id: "a12",
        title: "Binky Champion",
        description: "Master of the happy jump",
        icon: "🐰",
        earnedAt: "2023-06-01",
      },
      {
        id: "a13",
        title: "Litter Box Pro",
        description: "Perfect litter box habits",
        icon: "✨",
        earnedAt: "2023-06-15",
      },
    ],
    vetInfo: {
      clinicName: "Exotic Pet Care Center",
      veterinarianName: "Dr. Mark Thompson, DVM (Exotic Animal Specialist)",
      phone: "(555) 456-7890",
      address: "321 Bunny Trail, Portland, OR 97201",
      emergencyContact: "(555) 456-7891",
    },
  },
  // Pets for users 11-40 (1-2 pets per user)
  {
    id: "7",
    ownerId: "11",
    name: "Buddy",
    species: "dog",
    breed: "Labrador Retriever",
    age: 4,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet7",
    bio: "Friendly and energetic rescue dog. Loves playing fetch and swimming!",
    birthday: "2020-08-15",
    weight: "65 lbs",
    color: "Black",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet7-1"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Friendly", "Energetic", "Playful", "Loyal"],
    },
  },
  {
    id: "8",
    ownerId: "12",
    name: "Bella",
    species: "dog",
    breed: "German Shepherd",
    age: 3,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet8",
    bio: "Intelligent and protective. Training for search and rescue!",
    birthday: "2021-03-20",
    weight: "70 lbs",
    color: "Black and Tan",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet8-1"],
    personality: {
      energyLevel: 5,
      friendliness: 4,
      trainability: 5,
      playfulness: 4,
      independence: 3,
      traits: ["Intelligent", "Protective", "Loyal", "Active"],
    },
  },
  {
    id: "9",
    ownerId: "12",
    name: "Charlie",
    species: "dog",
    breed: "Beagle",
    age: 2,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet9",
    bio: "Curious and playful hound. Always following his nose!",
    birthday: "2022-06-10",
    weight: "25 lbs",
    color: "Tricolor",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet9-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 3,
      playfulness: 5,
      independence: 3,
      traits: ["Curious", "Playful", "Friendly", "Vocal"],
    },
  },
  {
    id: "10",
    ownerId: "13",
    name: "Mittens",
    species: "cat",
    breed: "Persian",
    age: 5,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet10",
    bio: "Elegant and calm Persian cat. Loves being groomed and pampered!",
    birthday: "2019-11-05",
    weight: "12 lbs",
    color: "White",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet10-1"],
    personality: {
      energyLevel: 2,
      friendliness: 3,
      trainability: 2,
      playfulness: 2,
      independence: 4,
      traits: ["Calm", "Elegant", "Gentle", "Quiet"],
    },
  },
  {
    id: "11",
    ownerId: "13",
    name: "Tiger",
    species: "cat",
    breed: "Tabby",
    age: 3,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet11",
    bio: "Adventurous tabby cat. Always exploring and getting into mischief!",
    birthday: "2021-07-12",
    weight: "14 lbs",
    color: "Orange Tabby",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet11-1"],
    personality: {
      energyLevel: 4,
      friendliness: 4,
      trainability: 3,
      playfulness: 5,
      independence: 3,
      traits: ["Adventurous", "Playful", "Curious", "Active"],
    },
  },
  {
    id: "12",
    ownerId: "14",
    name: "Polly",
    species: "bird",
    breed: "African Grey",
    age: 6,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet12",
    bio: "Intelligent African Grey. Knows over 200 words and loves puzzles!",
    birthday: "2018-05-18",
    color: "Grey",
    followers: [],
    photos: ["https://picsum.photos/400/400?random=pet12-1"],
    personality: {
      energyLevel: 3,
      friendliness: 4,
      trainability: 5,
      playfulness: 4,
      independence: 3,
      traits: ["Intelligent", "Talkative", "Curious", "Social"],
    },
  },
  {
    id: "13",
    ownerId: "15",
    name: "Coco",
    species: "dog",
    breed: "Yorkshire Terrier",
    age: 1,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet13",
    bio: "Tiny but mighty! Full of personality and energy!",
    birthday: "2023-09-25",
    weight: "6 lbs",
    color: "Black and Tan",
    followers: [],
    spayedNeutered: false,
    photos: ["https://picsum.photos/400/400?random=pet13-1"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Energetic", "Friendly", "Bold", "Playful"],
    },
  },
  {
    id: "14",
    ownerId: "15",
    name: "Pepper",
    species: "dog",
    breed: "Yorkshire Terrier",
    age: 2,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet14",
    bio: "Coco's big brother. Loves cuddles and playing with his sister!",
    birthday: "2022-12-10",
    weight: "7 lbs",
    color: "Silver and Tan",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet14-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 4,
      playfulness: 4,
      independence: 2,
      traits: ["Affectionate", "Playful", "Gentle", "Loyal"],
    },
  },
  {
    id: "15",
    ownerId: "16",
    name: "Rocky",
    species: "dog",
    breed: "Boxer",
    age: 2,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet15",
    bio: "Playful boxer with a goofy personality. Always makes us laugh!",
    birthday: "2022-04-30",
    weight: "65 lbs",
    color: "Brindle",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet15-1"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Playful", "Goofy", "Energetic", "Friendly"],
    },
  },
  {
    id: "16",
    ownerId: "17",
    name: "Fluffy",
    species: "rabbit",
    breed: "Angora",
    age: 2,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet16",
    bio: "Soft and gentle Angora rabbit. Loves being brushed and cuddled!",
    birthday: "2022-08-22",
    weight: "4 lbs",
    color: "White",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet16-1"],
    personality: {
      energyLevel: 3,
      friendliness: 5,
      trainability: 3,
      playfulness: 3,
      independence: 3,
      traits: ["Gentle", "Calm", "Friendly", "Soft"],
    },
  },
  {
    id: "17",
    ownerId: "18",
    name: "Zeus",
    species: "dog",
    breed: "Great Dane",
    age: 4,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet17",
    bio: "Gentle giant! Despite his size, he's the sweetest dog around!",
    birthday: "2020-10-15",
    weight: "140 lbs",
    color: "Fawn",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet17-1"],
    personality: {
      energyLevel: 3,
      friendliness: 5,
      trainability: 4,
      playfulness: 3,
      independence: 2,
      traits: ["Gentle", "Calm", "Friendly", "Loyal"],
    },
  },
  {
    id: "18",
    ownerId: "19",
    name: "Luna",
    species: "cat",
    breed: "Siamese",
    age: 3,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet18",
    bio: "Vocal Siamese with striking blue eyes. Always has something to say!",
    birthday: "2021-02-14",
    weight: "10 lbs",
    color: "Seal Point",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet18-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 4,
      playfulness: 4,
      independence: 2,
      traits: ["Vocal", "Social", "Active", "Affectionate"],
    },
  },
  {
    id: "19",
    ownerId: "19",
    name: "Midnight",
    species: "cat",
    breed: "Bombay",
    age: 2,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet19",
    bio: "Sleek black cat with a playful personality. Loves interactive toys!",
    birthday: "2022-05-20",
    weight: "9 lbs",
    color: "Black",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet19-1"],
    personality: {
      energyLevel: 4,
      friendliness: 4,
      trainability: 3,
      playfulness: 5,
      independence: 3,
      traits: ["Playful", "Active", "Curious", "Affectionate"],
    },
  },
  {
    id: "20",
    ownerId: "20",
    name: "Flash",
    species: "dog",
    breed: "Border Collie",
    age: 3,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet20",
    bio: "Agility champion in training! Super fast and incredibly smart!",
    birthday: "2021-09-08",
    weight: "45 lbs",
    color: "Black and White",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet20-1"],
    personality: {
      energyLevel: 5,
      friendliness: 4,
      trainability: 5,
      playfulness: 5,
      independence: 2,
      traits: ["Intelligent", "Energetic", "Focused", "Quick"],
    },
  },
  {
    id: "21",
    ownerId: "21",
    name: "Oreo",
    species: "dog",
    breed: "Mixed",
    age: 4,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet21",
    bio: "Rescue pup with the sweetest personality. Loves everyone he meets!",
    birthday: "2020-06-15",
    weight: "35 lbs",
    color: "Black and White",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet21-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Sweet", "Friendly", "Playful", "Loving"],
    },
  },
  {
    id: "22",
    ownerId: "21",
    name: "Nala",
    species: "cat",
    breed: "Ragdoll",
    age: 2,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet22",
    bio: "Fluffy Ragdoll who goes limp when picked up. Total lap cat!",
    birthday: "2022-03-25",
    weight: "11 lbs",
    color: "Seal Point",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet22-1"],
    personality: {
      energyLevel: 2,
      friendliness: 5,
      trainability: 3,
      playfulness: 3,
      independence: 2,
      traits: ["Calm", "Affectionate", "Gentle", "Relaxed"],
    },
  },
  {
    id: "23",
    ownerId: "22",
    name: "Rio",
    species: "bird",
    breed: "Cockatiel",
    age: 3,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet23",
    bio: "Whistling cockatiel who loves music and attention!",
    birthday: "2021-11-12",
    color: "Grey and Yellow",
    followers: [],
    photos: ["https://picsum.photos/400/400?random=pet23-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Vocal", "Social", "Playful", "Musical"],
    },
  },
  {
    id: "24",
    ownerId: "23",
    name: "Max",
    species: "dog",
    breed: "Golden Retriever",
    age: 8,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet24",
    bio: "Senior dog who's still young at heart. Gentle with everyone!",
    birthday: "2016-07-04",
    weight: "75 lbs",
    color: "Golden",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet24-1"],
    personality: {
      energyLevel: 3,
      friendliness: 5,
      trainability: 5,
      playfulness: 4,
      independence: 2,
      traits: ["Gentle", "Patient", "Friendly", "Calm"],
    },
  },
  {
    id: "25",
    ownerId: "24",
    name: "Oliver",
    species: "cat",
    breed: "British Shorthair",
    age: 4,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet25",
    bio: "Chunky British Shorthair with a round face. Loves food and naps!",
    birthday: "2020-01-20",
    weight: "16 lbs",
    color: "Blue",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet25-1"],
    personality: {
      energyLevel: 2,
      friendliness: 4,
      trainability: 2,
      playfulness: 3,
      independence: 4,
      traits: ["Calm", "Easygoing", "Chunky", "Lazy"],
    },
  },
  {
    id: "26",
    ownerId: "25",
    name: "Milo",
    species: "dog",
    breed: "French Bulldog",
    age: 1,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet26",
    bio: "Adorable Frenchie pup. Full of personality and snuggles!",
    birthday: "2023-10-05",
    weight: "22 lbs",
    color: "Brindle",
    followers: [],
    spayedNeutered: false,
    photos: ["https://picsum.photos/400/400?random=pet26-1"],
    personality: {
      energyLevel: 3,
      friendliness: 5,
      trainability: 3,
      playfulness: 4,
      independence: 2,
      traits: ["Playful", "Affectionate", "Funny", "Loving"],
    },
  },
  {
    id: "27",
    ownerId: "26",
    name: "Shadow",
    species: "dog",
    breed: "Husky",
    age: 3,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet27",
    bio: "Beautiful husky with striking blue eyes. Loves cold weather and running!",
    birthday: "2021-12-15",
    weight: "55 lbs",
    color: "Black and White",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet27-1"],
    personality: {
      energyLevel: 5,
      friendliness: 4,
      trainability: 3,
      playfulness: 5,
      independence: 4,
      traits: ["Energetic", "Independent", "Vocal", "Adventurous"],
    },
  },
  {
    id: "28",
    ownerId: "27",
    name: "Cotton",
    species: "rabbit",
    breed: "Mini Rex",
    age: 1,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet28",
    bio: "Soft mini rex with velvety fur. Loves to binky and explore!",
    birthday: "2023-06-18",
    weight: "3 lbs",
    color: "White",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet28-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 3,
      playfulness: 4,
      independence: 3,
      traits: ["Soft", "Playful", "Curious", "Gentle"],
    },
  },
  {
    id: "29",
    ownerId: "28",
    name: "Rex",
    species: "dog",
    breed: "Belgian Malinois",
    age: 5,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet29",
    bio: "Trained service dog. Intelligent and dedicated to helping!",
    birthday: "2019-04-10",
    weight: "65 lbs",
    color: "Fawn",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet29-1"],
    personality: {
      energyLevel: 5,
      friendliness: 4,
      trainability: 5,
      playfulness: 3,
      independence: 3,
      traits: ["Intelligent", "Focused", "Loyal", "Dedicated"],
    },
  },
  {
    id: "30",
    ownerId: "29",
    name: "Cleo",
    species: "cat",
    breed: "Egyptian Mau",
    age: 2,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet30",
    bio: "Elegant spotted cat. Fast runner and excellent jumper!",
    birthday: "2022-08-30",
    weight: "10 lbs",
    color: "Silver Spotted",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet30-1"],
    personality: {
      energyLevel: 4,
      friendliness: 4,
      trainability: 3,
      playfulness: 5,
      independence: 3,
      traits: ["Active", "Elegant", "Fast", "Playful"],
    },
  },
  {
    id: "31",
    ownerId: "29",
    name: "Dusty",
    species: "cat",
    breed: "Russian Blue",
    age: 4,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet31",
    bio: "Shy but sweet Russian Blue. Takes time to warm up but very loving!",
    birthday: "2020-05-12",
    weight: "11 lbs",
    color: "Blue-Grey",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet31-1"],
    personality: {
      energyLevel: 3,
      friendliness: 3,
      trainability: 3,
      playfulness: 3,
      independence: 4,
      traits: ["Shy", "Gentle", "Calm", "Reserved"],
    },
  },
  {
    id: "32",
    ownerId: "30",
    name: "Sunny",
    species: "bird",
    breed: "Sun Conure",
    age: 2,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet32",
    bio: "Colorful sun conure who loves attention and making loud noises!",
    birthday: "2022-07-22",
    color: "Orange and Yellow",
    followers: [],
    photos: ["https://picsum.photos/400/400?random=pet32-1"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Colorful", "Vocal", "Playful", "Social"],
    },
  },
  {
    id: "33",
    ownerId: "31",
    name: "Lily",
    species: "dog",
    breed: "Cavalier King Charles Spaniel",
    age: 6,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet33",
    bio: "Therapy dog bringing comfort to hospitals. Gentle and loving!",
    birthday: "2018-09-14",
    weight: "18 lbs",
    color: "Blenheim",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet33-1"],
    personality: {
      energyLevel: 2,
      friendliness: 5,
      trainability: 5,
      playfulness: 3,
      independence: 2,
      traits: ["Gentle", "Compassionate", "Calm", "Loving"],
    },
  },
  {
    id: "34",
    ownerId: "32",
    name: "Sam",
    species: "dog",
    breed: "Poodle",
    age: 5,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet34",
    bio: "Well-groomed poodle with a love for learning tricks!",
    birthday: "2019-02-28",
    weight: "50 lbs",
    color: "Apricot",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet34-1"],
    personality: {
      energyLevel: 3,
      friendliness: 5,
      trainability: 5,
      playfulness: 4,
      independence: 2,
      traits: ["Intelligent", "Elegant", "Friendly", "Curious"],
    },
  },
  {
    id: "35",
    ownerId: "33",
    name: "Sasha",
    species: "cat",
    breed: "Turkish Angora",
    age: 3,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet35",
    bio: "Elegant white Turkish Angora. Loves high places and being the center of attention!",
    birthday: "2021-04-05",
    weight: "9 lbs",
    color: "White",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet35-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 3,
      playfulness: 4,
      independence: 3,
      traits: ["Elegant", "Social", "Active", "Playful"],
    },
  },
  {
    id: "36",
    ownerId: "34",
    name: "Ace",
    species: "dog",
    breed: "Doberman Pinscher",
    age: 4,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet36",
    bio: "Protection dog in training. Loyal and dedicated to his handler!",
    birthday: "2020-11-08",
    weight: "75 lbs",
    color: "Black and Tan",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet36-1"],
    personality: {
      energyLevel: 5,
      friendliness: 3,
      trainability: 5,
      playfulness: 3,
      independence: 3,
      traits: ["Loyal", "Focused", "Intelligent", "Protective"],
    },
  },
  {
    id: "37",
    ownerId: "35",
    name: "Honey",
    species: "dog",
    breed: "Golden Retriever",
    age: 2,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet37",
    bio: "Photogenic golden retriever. Loves posing for the camera!",
    birthday: "2022-05-20",
    weight: "60 lbs",
    color: "Light Golden",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet37-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Photogenic", "Friendly", "Playful", "Happy"],
    },
  },
  {
    id: "38",
    ownerId: "36",
    name: "Blue",
    species: "bird",
    breed: "Budgerigar",
    age: 1,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet38",
    bio: "Chatty little budgie. Learning to talk and loves playing with toys!",
    birthday: "2023-08-10",
    color: "Blue",
    followers: [],
    photos: ["https://picsum.photos/400/400?random=pet38-1"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 4,
      playfulness: 5,
      independence: 2,
      traits: ["Chatty", "Playful", "Curious", "Social"],
    },
  },
  {
    id: "39",
    ownerId: "37",
    name: "Rusty",
    species: "dog",
    breed: "Australian Shepherd",
    age: 3,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet39",
    bio: "Rescue Aussie. Gained confidence and now loves everyone!",
    birthday: "2021-01-25",
    weight: "50 lbs",
    color: "Red Merle",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet39-1"],
    personality: {
      energyLevel: 5,
      friendliness: 5,
      trainability: 5,
      playfulness: 5,
      independence: 2,
      traits: ["Confident", "Energetic", "Loyal", "Playful"],
    },
  },
  {
    id: "40",
    ownerId: "38",
    name: "Maya",
    species: "cat",
    breed: "Bengal",
    age: 2,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet40",
    bio: "Active Bengal with wild-looking spots. Loves water and climbing!",
    birthday: "2022-10-15",
    weight: "10 lbs",
    color: "Brown Spotted",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet40-1"],
    personality: {
      energyLevel: 5,
      friendliness: 4,
      trainability: 4,
      playfulness: 5,
      independence: 3,
      traits: ["Active", "Adventurous", "Playful", "Curious"],
    },
  },
  {
    id: "41",
    ownerId: "39",
    name: "Simba",
    species: "cat",
    breed: "Maine Coon",
    age: 1,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet41",
    bio: "Growing Maine Coon kitten. Already big and getting bigger!",
    birthday: "2023-06-12",
    weight: "12 lbs",
    color: "Brown Tabby",
    followers: [],
    spayedNeutered: false,
    photos: ["https://picsum.photos/400/400?random=pet41-1"],
    personality: {
      energyLevel: 4,
      friendliness: 5,
      trainability: 3,
      playfulness: 5,
      independence: 3,
      traits: ["Playful", "Growing", "Friendly", "Curious"],
    },
  },
  {
    id: "42",
    ownerId: "40",
    name: "Thunder",
    species: "dog",
    breed: "Australian Cattle Dog",
    age: 4,
    gender: "male",
    avatar: "https://picsum.photos/400/400?random=pet42",
    bio: "Agility and flyball competitor. Fast and focused athlete!",
    birthday: "2020-07-18",
    weight: "45 lbs",
    color: "Blue Heeler",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet42-1"],
    personality: {
      energyLevel: 5,
      friendliness: 4,
      trainability: 5,
      playfulness: 5,
      independence: 3,
      traits: ["Athletic", "Focused", "Fast", "Driven"],
    },
  },
  {
    id: "43",
    ownerId: "40",
    name: "Zoe",
    species: "dog",
    breed: "Jack Russell Terrier",
    age: 3,
    gender: "female",
    avatar: "https://picsum.photos/400/400?random=pet43",
    bio: "Tiny but fierce competitor. Loves agility and flyball!",
    birthday: "2021-03-22",
    weight: "18 lbs",
    color: "White and Brown",
    followers: [],
    spayedNeutered: true,
    photos: ["https://picsum.photos/400/400?random=pet43-1"],
    personality: {
      energyLevel: 5,
      friendliness: 4,
      trainability: 4,
      playfulness: 5,
      independence: 3,
      traits: ["Energetic", "Fearless", "Playful", "Competitive"],
    },
  },
]

export const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    petId: "1",
    authorId: "1",
    title: "Our Amazing Day at the Beach",
    content:
      "Today was incredible! Max and Luna had the best time playing in the waves and running on the sand. Max discovered his love for swimming in the ocean, while Luna preferred chasing seagulls. We spent hours there and they are now completely exhausted. The beach is definitely our new favorite spot for weekend adventures!",
    coverImage: "/golden-retriever-beach.png",
    tags: ["beach", "adventure", "swimming"],
    likes: ["2", "3", "4"],
    createdAt: "2024-12-20",
    updatedAt: "2024-12-20",
  },
  {
    id: "2",
    petId: "3",
    authorId: "2",
    title: "Whiskers New Favorite Toy",
    content:
      "Whiskers has found a new obsession - a simple cardboard box! I bought him an expensive cat tower, but he prefers the box it came in. Typical cat behavior! He spends hours in there, peeking out and ambushing Shadow when she walks by. Sometimes the simplest things bring the most joy.",
    coverImage: "/cat-in-box.jpg",
    tags: ["toys", "funny", "cats"],
    likes: ["1", "3"],
    createdAt: "2024-12-19",
    updatedAt: "2024-12-19",
  },
  {
    id: "3",
    petId: "5",
    authorId: "3",
    title: "Kiwi Learned a New Trick!",
    content:
      "Im so proud of Kiwi! After weeks of training, he finally learned to wave hello. Every morning now, he greets me with a little wing wave and it absolutely melts my heart. Training birds requires patience, but the bond you build is so worth it. Next, were working on teaching him to ring a bell!",
    coverImage: "/parrot-waving.jpg",
    tags: ["training", "tricks", "birds"],
    likes: ["1", "2", "4"],
    createdAt: "2024-12-18",
    updatedAt: "2024-12-18",
  },
  {
    id: "4",
    petId: "2",
    authorId: "1",
    title: "Lunas First Agility Class",
    content:
      "Luna attended her first agility class today and she was a natural! She zoomed through the tunnel, jumped over hurdles, and even mastered the weave poles on her first try. The instructor said she has great potential. Max came along to watch and was very proud of his little sister. Cant wait for next weeks class!",
    coverImage: "/dog-agility-course.png",
    tags: ["training", "agility", "exercise"],
    likes: ["2", "3"],
    createdAt: "2024-12-17",
    updatedAt: "2024-12-17",
  },
  {
    id: "5",
    petId: "6",
    authorId: "4",
    title: "Thumpers Bunny-Proofed Room Tour",
    content:
      "Finally finished bunny-proofing Thumpers room! Covered all cables, removed toxic plants, and created safe hiding spots. He now has a whole room to explore and binky around in. The joy on his face when he does his happy jumps makes all the effort worthwhile. If youre thinking about free-roaming your rabbit, I highly recommend it!",
    coverImage: "/rabbit-room-setup.jpg",
    tags: ["care", "housing", "rabbits"],
    likes: ["1", "2", "3"],
    createdAt: "2024-12-16",
    updatedAt: "2024-12-16",
  },
  {
    id: "100",
    petId: "1",
    authorId: "1",
    title: "Max's Favorite Hiking Trail",
    content:
      "Took Max on our favorite mountain trail today! He's such an adventure dog - nothing gets him more excited than exploring new paths. We hiked for 4 miles and he still had energy to play fetch at the top. The view was incredible and Max was in his element. Luna stayed home this time (she's still learning to keep up with big brother), but next time we'll bring both pups!",
    coverImage: "/golden-retriever-running.png",
    tags: ["hiking", "adventure", "outdoor", "exercise"],
    likes: ["2", "3", "5", "6"],
    createdAt: "2024-12-15",
    updatedAt: "2024-12-15",
  },
  {
    id: "101",
    petId: "2",
    authorId: "1",
    title: "Luna's First Swimming Lesson",
    content:
      "Luna had her first swimming lesson today! She was hesitant at first, but Max was there to show her how it's done. After watching her big brother splash around, she finally got brave enough to wade in the shallow end. By the end, she was paddling around like a pro! Max was so proud and kept checking on her. These two are the best siblings.",
    coverImage: "/golden-retriever-swimming.jpg",
    tags: ["swimming", "training", "water", "siblings"],
    likes: ["2", "3", "4", "5"],
    createdAt: "2024-12-14",
    updatedAt: "2024-12-14",
  },
  {
    id: "102",
    petId: "1",
    authorId: "1",
    title: "Max's Training Milestone: Heel Command Mastered!",
    content:
      "After weeks of practice, Max has finally mastered the heel command! We've been working on loose-leash walking, and today he walked perfectly by my side for the entire 30-minute walk. No pulling, no distractions - just perfect focus. I'm so proud of this smart boy! The training treats definitely helped, but his eagerness to please is what makes the difference. Luna is taking notes and trying to copy him - it's adorable!",
    coverImage: "/golden-retriever-puppy.png",
    tags: ["training", "obedience", "walking", "milestone"],
    likes: ["2", "3", "5", "7", "8"],
    createdAt: "2024-12-13",
    updatedAt: "2024-12-13",
  },
  {
    id: "103",
    petId: "2",
    authorId: "1",
    title: "Luna's Playdate with Her Best Friend",
    content:
      "Luna had an amazing playdate with her best friend Bella today! They ran around the dog park for hours, chasing each other and playing tug-of-war. Luna has so much energy and loves making new doggy friends. Max came along too and played the role of the watchful big brother. It's so heartwarming to see how social and happy these two are. Socialization is so important for puppies!",
    coverImage: "/golden-retriever-playing.png",
    tags: ["playdate", "socialization", "friends", "fun"],
    likes: ["2", "4", "5", "6"],
    createdAt: "2024-12-12",
    updatedAt: "2024-12-12",
  },
  {
    id: "104",
    petId: "1",
    authorId: "1",
    title: "Max's Afternoon Nap Time",
    content:
      "Caught Max in the most adorable sleeping position after our morning hike. He found the sunniest spot in the living room and passed out with his favorite toy. Even with all that energy, he knows when to rest! These peaceful moments are some of my favorites. There's nothing quite like watching your dog sleep soundly after a day full of adventures.",
    coverImage: "/golden-retriever-sleeping.png",
    tags: ["naptime", "cute", "relaxation", "photography"],
    likes: ["2", "3", "5", "6", "7", "9"],
    createdAt: "2024-12-11",
    updatedAt: "2024-12-11",
  },
  {
    id: "105",
    petId: "2",
    authorId: "1",
    title: "Luna Learning to Fetch",
    content:
      "Luna is getting better at fetch every day! She's still working on the 'drop it' part, but she's running after the ball with so much enthusiasm. Max tried to help by showing her how it's done, but Luna wanted to do it her way. It's hilarious watching her carry the ball back in her mouth but not quite understanding that she needs to give it back. Practice makes perfect!",
    coverImage: "/golden-retriever-toy.png",
    tags: ["fetch", "training", "puppy", "learning", "playtime"],
    likes: ["2", "3", "4", "5"],
    createdAt: "2024-12-10",
    updatedAt: "2024-12-10",
  },
  {
    id: "106",
    petId: "1",
    authorId: "1",
    title: "Weekend Camping Trip with the Pups",
    content:
      "Just got back from an amazing weekend camping trip with Max and Luna! We found the perfect dog-friendly campground near the lake. Max loved swimming in the lake every morning, and Luna explored every inch of our campsite. We spent evenings around the campfire (they were fascinated by the flames) and nights cuddled in the tent. They both slept like rocks after all the outdoor activities. Best camping trip ever!",
    coverImage: "/golden-retriever-beach.png",
    tags: ["camping", "adventure", "outdoor", "weekend", "travel"],
    likes: ["2", "3", "5", "6", "7", "8", "10"],
    createdAt: "2024-12-09",
    updatedAt: "2024-12-09",
  },
  {
    id: "107",
    petId: "2",
    authorId: "1",
    title: "Luna's Grooming Day",
    content:
      "Luna had her first professional grooming session today! She was a bit nervous at first, but the groomer was so patient and gentle. Now she's looking absolutely gorgeous with her fluffy golden coat all cleaned and brushed. Max is a bit jealous that he didn't get the same treatment - but his turn is next week! Regular grooming is so important for keeping their coats healthy and shiny.",
    coverImage: "/golden-retriever-puppy-playing.jpg",
    tags: ["grooming", "care", "health", "beauty"],
    likes: ["2", "3", "4", "5", "6"],
    createdAt: "2024-12-08",
    updatedAt: "2024-12-08",
  },
  {
    id: "108",
    petId: "1",
    authorId: "1",
    title: "Max's Vet Checkup - All Clear!",
    content:
      "Took Max for his annual vet checkup today and got great news - he's in perfect health! The vet said his weight is ideal, his joints are healthy, and his energy levels are perfect for his age. We also got his vaccinations updated. Max was such a good boy during the entire visit, even when getting his shots. Healthy pets are happy pets!",
    coverImage: "/golden-retriever.png",
    tags: ["vet", "health", "wellness", "checkup", "care"],
    likes: ["2", "3", "5", "7", "8"],
    createdAt: "2024-12-07",
    updatedAt: "2024-12-07",
  },
  {
    id: "109",
    petId: "2",
    authorId: "1",
    title: "Sibling Bonding Time",
    content:
      "Caught Max and Luna having the sweetest sibling moment today. Luna was trying to learn a new trick, and Max was sitting right there watching her, almost like he was coaching her. When she finally got it right, he got so excited and started wagging his tail like crazy! These two have the most amazing bond. Max is always looking out for his little sister, and Luna absolutely adores him.",
    coverImage: "/golden-retriever-playing.png",
    tags: ["siblings", "bonding", "family", "love", "cute"],
    likes: ["2", "3", "4", "5", "6", "7", "8", "9", "10"],
    createdAt: "2024-12-06",
    updatedAt: "2024-12-06",
  },
  {
    id: "110",
    petId: "1",
    authorId: "1",
    title: "Max's Favorite Treat Recipe",
    content:
      "I've been making homemade training treats for Max and Luna, and they absolutely love them! The recipe is super simple: mashed sweet potato, oats, and a bit of peanut butter. I bake them into small bite-sized pieces perfect for training. Max goes crazy for these - they're his absolute favorite reward. Plus, I know exactly what's in them, which gives me peace of mind. Both pups get so excited when they see me pull out the treat container!",
    coverImage: "/golden-retriever-toy.png",
    tags: ["homemade", "treats", "training", "recipes", "food"],
    likes: ["2", "3", "5", "6", "8"],
    createdAt: "2024-12-05",
    updatedAt: "2024-12-05",
  },
  {
    id: "111",
    petId: "2",
    authorId: "1",
    title: "Luna's Progress in Obedience Class",
    content:
      "Just finished another week of obedience class with Luna, and I'm so proud of her progress! She's mastered sit, stay, and come commands. The instructor mentioned how quickly she's learning and how eager she is to please. Max came along as our practice partner, and it's so cute watching him demonstrate the commands for her. Luna is definitely following in her big brother's paw steps! Next week we're starting on recall training.",
    coverImage: "/dog-agility-course.png",
    tags: ["training", "obedience", "progress", "puppy", "learning"],
    likes: ["2", "3", "4", "5", "6", "7"],
    createdAt: "2024-12-04",
    updatedAt: "2024-12-04",
  },
  {
    id: "112",
    petId: "1",
    authorId: "1",
    title: "Morning Walk Ritual",
    content:
      "Our morning walks have become my favorite part of the day. Max and Luna wake me up at 6:30 AM sharp every morning, tails wagging, ready for adventure. We walk through our neighborhood park, and Max always stops at the same spots - the big oak tree, the bench by the pond, and his favorite fire hydrant. Luna tries to keep up but often stops to smell the flowers (literally). These peaceful morning moments set the tone for the whole day.",
    coverImage: "/golden-retriever-running.png",
    tags: ["walking", "routine", "morning", "peaceful", "outdoor"],
    likes: ["2", "3", "5", "6", "8", "9"],
    createdAt: "2024-12-03",
    updatedAt: "2024-12-03",
  },
  // Generate 95 more blog posts to reach 100 total
  ...Array.from({ length: 95 }, (_, i) => {
    const postId = 6 + i
    const allPets = ["1", "2", "3", "4", "5", "6"]
    const allAuthors = ["1", "2", "3", "4"]
    const petId = allPets[i % allPets.length]
    const authorId = allAuthors[i % allAuthors.length]
    const date = new Date(2024, 11, 15 - i)
    const dateStr = date.toISOString().split("T")[0]

    const postTemplates = [
      { title: "Morning Walk Adventures", content: "Started our day with an amazing walk through the park. The fresh air and exercise really energized us both!", tags: ["adventure", "walk", "outdoor"], category: "adventure" },
      { title: "Teaching New Commands", content: "Spent the afternoon working on new tricks. Progress is slow but steady, and patience is key!", tags: ["training", "tricks", "learning"], category: "training" },
      { title: "Photo Shoot Day", content: "Had a fun photo session today. Captured so many cute moments that I'll cherish forever!", tags: ["photo", "photography", "cute"], category: "photos" },
      { title: "Playtime at the Park", content: "Hours of fun playing fetch and running around. Nothing beats watching them have the time of their life!", tags: ["play", "playtime", "games"], category: "playtime" },
      { title: "Hilarious Moment Caught", content: "Caught the funniest moment on camera today. They never fail to make me laugh with their silly antics!", tags: ["funny", "cute", "silly"], category: "funny" },
      { title: "Beach Trip Memories", content: "Perfect weather for a beach day. Sand, sun, and lots of splashing in the waves!", tags: ["beach", "adventure", "outdoor"], category: "adventure" },
      { title: "Learning to Sit", content: "Making progress with basic commands. Every small success feels like a huge victory!", tags: ["training", "obedience", "learning"], category: "training" },
      { title: "Sunset Photography", content: "Golden hour photos turned out absolutely beautiful. Nature provides the best backdrop!", tags: ["photo", "picture", "sunset"], category: "photos" },
      { title: "Toy Collection Update", content: "Added some new interactive toys to the collection. They're already favorites!", tags: ["toys", "play", "fun"], category: "playtime" },
      { title: "Adorable Sleeping Pose", content: "Caught them in the most adorable sleeping position. Too cute not to share!", tags: ["funny", "cute", "adorable"], category: "funny" },
    ]

    const template = postTemplates[i % postTemplates.length]
    const likes = Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => String((j % 4) + 1))

    return {
      id: String(postId),
      petId,
      authorId,
      title: `${template.title} #${i + 1}`,
      content: template.content,
      tags: template.tags,
      likes,
      createdAt: dateStr,
      updatedAt: dateStr,
    }
  }),

  // Add 20 additional blog posts with random categories
  ...Array.from({ length: 20 }, (_, i) => {
    const postId = 101 + i
    const allPets = ["1", "2", "3", "4", "5", "6"]
    const allAuthors = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    const petId = allPets[i % allPets.length]
    const authorId = allAuthors[i % allAuthors.length]
    const date = new Date(2024, 11, 10 - i)
    const dateStr = date.toISOString().split("T")[0]

    // Categories and their associated tags
    const categories = [
      {
        category: "adventure",
        templates: [
          { title: "Mountain Hiking Expedition", content: "Today we conquered a new mountain trail! The views were breathtaking and my pet was a natural hiker. We both got a great workout and enjoyed nature's beauty together.", tags: ["adventure", "hiking", "outdoor", "mountain"] },
          { title: "Camping Under the Stars", content: "First camping trip was a huge success! Set up the tent, built a campfire, and watched the stars. My pet loved exploring the campsite and snuggling in the tent at night.", tags: ["adventure", "camping", "outdoor", "travel"] },
          { title: "Forest Trail Discovery", content: "Found an amazing hidden trail in the local forest. The path was peaceful and my pet enjoyed all the new smells and sights. Great way to spend a weekend morning!", tags: ["adventure", "trail", "outdoor", "nature"] },
          { title: "Riverside Adventure", content: "Spent the day exploring along the river. My pet loved splashing in the shallow water and chasing after sticks. Perfect weather for an outdoor adventure!", tags: ["adventure", "river", "outdoor", "swimming"] },
        ],
      },
      {
        category: "training",
        templates: [
          { title: "Advanced Trick Training", content: "Working on more complex tricks now. The dedication is paying off and seeing the progress makes all the effort worthwhile. Training builds such a strong bond!", tags: ["training", "tricks", "advanced", "learning"] },
          { title: "Obedience Class Progress", content: "Just finished another obedience class session. The instructor praised our progress and my pet is becoming so well-behaved. Consistency is key!", tags: ["training", "obedience", "lesson", "progress"] },
          { title: "Agility Training Session", content: "Agility training is getting more challenging but we're both loving it! The course practice is improving coordination and strengthening our teamwork.", tags: ["training", "agility", "exercise", "practice"] },
          { title: "New Command Mastered", content: "Successfully taught a new command today! The celebration with treats was well-deserved. Every small achievement feels like a major milestone.", tags: ["training", "commands", "teach", "success"] },
        ],
      },
      {
        category: "funny",
        templates: [
          { title: "Bath Time Fails", content: "Attempted bath time and it turned into a comedy show! The reaction was priceless and I couldn't help but laugh. Some things never get easier but they're always entertaining!", tags: ["funny", "bath", "cute", "silly"] },
          { title: "Kitchen Helper Mishaps", content: "My pet decided to 'help' in the kitchen today. Let's just say the kitchen looks different now but in the funniest way possible. These moments make life interesting!", tags: ["funny", "kitchen", "hilarious", "cute"] },
          { title: "Zoomies at Midnight", content: "The midnight zoomies are real! Just when I thought everyone was settled, chaos erupted. These spontaneous energy bursts are so funny to watch.", tags: ["funny", "zoomies", "silly", "energy"] },
          { title: "Sneaky Treat Stealing", content: "Caught my pet in the act of being extra sneaky for treats. The guilty look afterwards was absolutely adorable. Can't help but reward such cleverness!", tags: ["funny", "sneaky", "treats", "adorable"] },
        ],
      },
      {
        category: "photos",
        templates: [
          { title: "Golden Hour Photography", content: "Captured some stunning photos during golden hour today. The lighting was perfect and my pet looked absolutely majestic in every shot. Nature's lighting beats anything artificial!", tags: ["photo", "photography", "golden-hour", "beautiful"] },
          { title: "Action Shot Collection", content: "Managed to capture some incredible action shots during playtime. Freezing those moments in time shows just how graceful and athletic pets can be. Photography at its best!", tags: ["photo", "action", "picture", "play"] },
          { title: "Portrait Session Success", content: "Professional portrait session turned out amazing! Every photo shows my pet's personality shining through. These memories will last forever.", tags: ["photo", "portrait", "photography", "cute"] },
          { title: "Nature Photo Series", content: "Created a beautiful series of photos with nature as the backdrop. The combination of natural beauty and pet charm creates magical moments captured forever.", tags: ["photo", "nature", "picture", "outdoor"] },
        ],
      },
      {
        category: "playtime",
        templates: [
          { title: "New Toy Collection", content: "Added some exciting new toys to our collection! The interactive ones are already favorites and provide hours of entertainment. Playtime just got way more fun!", tags: ["playtime", "toys", "fun", "games"] },
          { title: "Dog Park Playdate", content: "Amazing playdate at the dog park today! Socializing with other pets and owners while watching everyone have fun together. These social experiences are so valuable!", tags: ["playtime", "park", "social", "fun"] },
          { title: "Indoor Play Session", content: "Rainy day didn't stop us from having fun! Set up an indoor play area and we had a blast with puzzles and games. Creativity makes every day special.", tags: ["playtime", "indoor", "games", "activity"] },
          { title: "Fetch Championship", content: "Played the longest game of fetch ever! We both got tired but couldn't stop. The determination and enthusiasm never ceases to amaze me. Best workout ever!", tags: ["playtime", "fetch", "exercise", "fun"] },
        ],
      },
    ]

    // Select random category
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    const template = randomCategory.templates[Math.floor(Math.random() * randomCategory.templates.length)]
    const likes = Array.from({ length: Math.floor(Math.random() * 8) }, (_, j) => String((j % 10) + 1))
    const hashtags = template.tags.slice(0, 2)

    return {
      id: String(postId),
      petId,
      authorId,
      title: template.title,
      content: template.content,
      tags: template.tags,
      hashtags,
      likes,
      createdAt: dateStr,
      updatedAt: dateStr,
      privacy: "public" as const,
    }
  }),
]

export const mockComments: Comment[] = [
  {
    id: "1",
    postId: "1",
    userId: "2",
    content: "This looks amazing! Whiskers would hate the beach but Im jealous of your adventure!",
    createdAt: "2024-12-20",
  },
  {
    id: "2",
    postId: "1",
    userId: "3",
    content: "What a beautiful day! Your dogs look so happy!",
    createdAt: "2024-12-20",
  },
  {
    id: "3",
    postId: "2",
    userId: "1",
    content: "Haha! Cats are so funny. Max and Luna also prefer boxes over their expensive beds!",
    createdAt: "2024-12-19",
  },
  {
    id: "4",
    postId: "3",
    userId: "2",
    content: "Thats incredible! How long did it take to train him?",
    createdAt: "2024-12-18",
  },
  {
    id: "5",
    postId: "5",
    userId: "1",
    content: "This is so helpful! Ive been thinking about getting a rabbit and this gives me great ideas.",
    createdAt: "2024-12-16",
  },
]

export const mockWikiArticles: WikiArticle[] = [
  {
    id: "1",
    title: "Complete Guide to Dog Nutrition",
    slug: "dog-nutrition-guide",
    category: "nutrition",
    species: ["dog"],
    content: `# Complete Guide to Dog Nutrition

Proper nutrition is essential for your dog's health and wellbeing. This comprehensive guide covers everything you need to know about feeding your canine companion.

## Understanding Dog Nutritional Needs

Dogs require a balanced diet that includes proteins, fats, carbohydrates, vitamins, and minerals. The specific amounts depend on factors like age, size, activity level, and health status.

### Essential Nutrients

**Proteins**: Building blocks for muscles, skin, and organs. Look for high-quality animal proteins like chicken, beef, or fish.

**Fats**: Provide energy and support cell function. Omega-3 and Omega-6 fatty acids are particularly important for coat health.

**Carbohydrates**: Source of energy and fiber for digestive health.

**Vitamins & Minerals**: Support immune function, bone health, and overall wellbeing.

## Choosing the Right Food

Consider your dog's life stage (puppy, adult, senior), size, and any special health needs. Always check the AAFCO statement on dog food labels to ensure complete nutrition.

## Feeding Guidelines

- Feed adult dogs twice daily
- Puppies need 3-4 meals per day
- Always provide fresh water
- Avoid overfeeding to prevent obesity

## Foods to Avoid

Never feed your dog chocolate, grapes, onions, garlic, xylitol, or alcohol. These can be toxic and potentially fatal.`,
    coverImage: "/dog-food-nutrition.png",
    authorId: "1",
    views: 1250,
    likes: ["2", "3", "4"],
    createdAt: "2024-11-15",
    updatedAt: "2024-12-01",
  },
  {
    id: "2",
    title: "Cat Behavior: Understanding Your Feline Friend",
    slug: "understanding-cat-behavior",
    category: "behavior",
    species: ["cat"],
    content: `# Cat Behavior: Understanding Your Feline Friend

Cats communicate in subtle ways that can be easy to miss. Learning to read your cat's body language and behavior will strengthen your bond.

## Body Language Basics

**Tail Position**: A high, upright tail indicates happiness. A puffed tail signals fear or aggression.

**Ear Position**: Forward ears show interest. Flattened ears indicate fear or aggression.

**Purring**: Usually contentment, but can also indicate pain or stress.

## Common Behaviors Explained

### Kneading
When cats push their paws in and out against soft surfaces, it's a sign of contentment from kittenhood.

### Head Bunting
Rubbing their head against you is a sign of affection and marking you with their scent.

### Slow Blinking
A slow blink from your cat is like a kiss - it shows trust and affection.

## Addressing Problem Behaviors

Most "problem" behaviors have underlying causes. Scratching furniture can be redirected with proper scratching posts. Litter box issues often indicate stress or medical problems.

## Creating a Cat-Friendly Environment

Provide vertical spaces, hiding spots, and interactive toys to keep your cat mentally and physically stimulated.`,
    coverImage: "/cat-behavior.png",
    authorId: "2",
    views: 980,
    likes: ["1", "3"],
    createdAt: "2024-11-20",
    updatedAt: "2024-11-20",
  },
  {
    id: "3",
    title: "Bird Care 101: Essential Tips for New Owners",
    slug: "bird-care-essentials",
    category: "care",
    species: ["bird"],
    content: `# Bird Care 101: Essential Tips for New Owners

Birds make wonderful companions, but they require specialized care. This guide covers the basics every bird owner should know.

## Housing Requirements

### Cage Size
Your bird's cage should be large enough for them to spread their wings fully and move around comfortably. Bigger is always better!

### Cage Placement
Place the cage in a social area where your bird can interact with family, but away from kitchens (fumes can be toxic) and drafts.

## Diet and Nutrition

Birds need a varied diet including:
- High-quality pellets (70-80% of diet)
- Fresh vegetables daily
- Limited fruits as treats
- Fresh water changed daily

**Never feed**: Avocado, chocolate, salt, caffeine, or alcohol.

## Social Needs

Birds are highly social creatures. They need:
- Daily interaction and playtime
- Mental stimulation through toys
- Training sessions for bonding
- Consistent routine

## Health Care

- Annual vet checkups with an avian specialist
- Watch for signs of illness (fluffed feathers, lethargy, appetite changes)
- Maintain proper humidity levels
- Provide opportunities for bathing

## Enrichment

Rotate toys regularly, provide foraging opportunities, and teach tricks to keep your bird mentally engaged.`,
    coverImage: "/pet-bird-care.jpg",
    authorId: "3",
    views: 756,
    likes: ["1", "2", "4"],
    createdAt: "2024-12-01",
    updatedAt: "2024-12-01",
  },
  {
    id: "4",
    title: "Rabbit Health: Common Issues and Prevention",
    slug: "rabbit-health-guide",
    category: "health",
    species: ["rabbit"],
    content: `# Rabbit Health: Common Issues and Prevention

Rabbits are delicate creatures that require attentive care. Understanding common health issues can help you keep your bunny healthy.

## Digestive Health

### GI Stasis
The most common and serious condition in rabbits. Signs include:
- Not eating or producing feces
- Lethargy
- Hunched posture

**Prevention**: Provide unlimited hay, regular exercise, and minimize stress.

### Dental Problems
Rabbit teeth grow continuously. Provide unlimited hay and wooden chew toys to prevent overgrowth.

## Preventive Care

### Diet
- Unlimited timothy hay (80% of diet)
- Fresh leafy greens daily
- Limited pellets
- Occasional fruit treats

### Exercise
Rabbits need at least 3-4 hours of exercise daily in a safe, bunny-proofed area.

### Grooming
- Brush regularly, especially during molting
- Trim nails monthly
- Never bathe (spot clean only)

## Signs of Illness

Seek immediate veterinary care if you notice:
- Loss of appetite
- Diarrhea or no feces
- Difficulty breathing
- Head tilt
- Lethargy

## Finding a Vet

Always use a rabbit-savvy exotic vet. Regular rabbits are not the same as dogs and cats!

## Spaying/Neutering

Highly recommended to prevent reproductive cancers and improve behavior.`,
    coverImage: "/rabbit-health-care.jpg",
    authorId: "4",
    views: 623,
    likes: ["1", "2", "3"],
    createdAt: "2024-12-05",
    updatedAt: "2024-12-05",
  },
  {
    id: "5",
    title: "Puppy Training: The First 6 Months",
    slug: "puppy-training-guide",
    category: "training",
    species: ["dog"],
    content: `# Puppy Training: The First 6 Months

The first six months are crucial for puppy development. Proper training during this period sets the foundation for a well-behaved adult dog.

## 8-12 Weeks: Socialization Period

This is the most critical time for socialization. Expose your puppy to:
- Different people (ages, appearances)
- Various environments
- Other vaccinated dogs
- Different sounds and surfaces

### Basic Commands
Start with simple commands:
- Name recognition
- Sit
- Come
- Leave it

## 3-4 Months: Building Foundation

### House Training
- Take puppy out every 2 hours
- After meals, naps, and play
- Praise immediately for outdoor elimination
- Never punish accidents

### Crate Training
Make the crate a positive space. Use treats and toys to create positive associations.

## 4-6 Months: Adolescence Begins

### Continued Training
- Down
- Stay
- Loose leash walking
- Drop it

### Managing Teething
Provide appropriate chew toys and redirect biting behavior.

## Training Tips

**Positive Reinforcement**: Reward good behavior with treats, praise, and play.

**Consistency**: Everyone in the household should use the same commands and rules.

**Short Sessions**: Keep training sessions to 5-10 minutes, multiple times daily.

**Patience**: Puppies learn at different rates. Stay patient and positive.

## Common Mistakes to Avoid

- Inconsistent rules
- Punishment-based training
- Insufficient exercise
- Skipping socialization

## When to Seek Help

Consider professional training if you're struggling with aggression, severe anxiety, or other behavioral issues.`,
    coverImage: "/puppy-training.png",
    authorId: "1",
    views: 1450,
    likes: ["2", "3", "4"],
    createdAt: "2024-11-10",
    updatedAt: "2024-11-25",
  },
  // Generate articles with subcategories - 20 articles per subcategory
  ...(() => {
    // Define subcategories for each main category
    const subcategories = {
      care: ["daily-care", "grooming", "exercise", "housing"],
      health: ["general-health", "preventive-care", "common-illnesses", "emergency-care"],
      training: ["basic-training", "advanced-training", "puppy-training", "behavior-modification"],
      nutrition: ["feeding-basics", "special-diets", "treats-supplements", "weight-management"],
      behavior: ["understanding-behavior", "problem-behaviors", "socialization", "communication"],
      breeds: ["dog-breeds", "cat-breeds", "breed-selection", "mixed-breeds"],
    }

    // Generate 20 articles for each subcategory
    const additionalArticles: WikiArticle[] = []
    let articleId = 6

    Object.entries(subcategories).forEach(([category, subcats]) => {
      subcats.forEach((subcategory) => {
        for (let i = 0; i < 20; i++) {
          const authors = ["1", "2", "3", "4"]
          const authorId = authors[articleId % authors.length]
          const date = new Date(2024, 10, 25 - articleId)
          const dateStr = date.toISOString().split("T")[0]

          const subcategoryTitles: Record<string, string[]> = {
            "daily-care": ["Morning Routine Guide", "Evening Routine Tips", "Weekly Care Schedule", "Monthly Care Checklist"],
            "grooming": ["Brushing Techniques", "Bathing Basics", "Nail Trimming Guide", "Dental Care Essentials"],
            "exercise": ["Exercise Requirements", "Play Activities", "Outdoor Safety", "Indoor Exercise Ideas"],
            "housing": ["Cage Setup", "Bedding Options", "Environmental Enrichment", "Safety Considerations"],
            "general-health": ["Health Monitoring", "Vital Signs Guide", "Wellness Checks", "Health Records"],
            "preventive-care": ["Vaccination Schedule", "Parasite Prevention", "Dental Health", "Regular Checkups"],
            "common-illnesses": ["Recognizing Symptoms", "Treatment Options", "Recovery Care", "When to Call Vet"],
            "emergency-care": ["Emergency Preparedness", "First Aid Basics", "Poisoning Response", "Trauma Care"],
            "basic-training": ["Sit Command", "Stay Command", "Come Command", "Leave It Training"],
            "advanced-training": ["Trick Training", "Agility Training", "Therapy Training", "Service Dog Training"],
            "puppy-training": ["Puppy Socialization", "House Training", "Crate Training", "Early Commands"],
            "behavior-modification": ["Positive Reinforcement", "Desensitization", "Counter-Conditioning", "Behavior Plans"],
            "feeding-basics": ["Feeding Schedule", "Portion Control", "Food Selection", "Meal Planning"],
            "special-diets": ["Prescription Diets", "Homemade Food", "Raw Diets", "Grain-Free Options"],
            "treats-supplements": ["Treat Selection", "Training Treats", "Nutritional Supplements", "Vitamins and Minerals"],
            "weight-management": ["Weight Monitoring", "Obesity Prevention", "Weight Loss Plans", "Healthy Weight Maintenance"],
            "understanding-behavior": ["Body Language", "Communication Signals", "Behavior Patterns", "Natural Instincts"],
            "problem-behaviors": ["Excessive Barking", "Destructive Chewing", "Separation Anxiety", "Aggression Issues"],
            "socialization": ["Early Socialization", "Socializing Adults", "Fear Reduction", "Confidence Building"],
            "communication": ["Understanding Signals", "Training Communication", "Building Trust", "Bonding Activities"],
            "dog-breeds": ["Large Dog Breeds", "Small Dog Breeds", "Working Breeds", "Companion Breeds"],
            "cat-breeds": ["Active Cat Breeds", "Calm Cat Breeds", "Long-Haired Cats", "Short-Haired Cats"],
            "breed-selection": ["Choosing a Breed", "Breed Research", "Breed Characteristics", "Breed Compatibility"],
            "mixed-breeds": ["Mixed Breed Benefits", "Understanding Mixes", "Health Advantages", "Temperament Predictions"],
          }

          const titles = subcategoryTitles[subcategory] || ["Article"]
          const title = titles[i % titles.length]
          const articleNumber = i + 1

          const content = `# ${title}\n\n## Introduction\n\nThis comprehensive guide covers essential information about ${subcategory.replace(/-/g, " ")} for your pet.\n\n## Key Concepts\n\nUnderstanding the fundamentals is crucial for proper pet care. This guide provides detailed information and practical tips.\n\n## Best Practices\n\nFollow these recommendations for optimal results:\n- Regular monitoring and assessment\n- Consistent routines\n- Professional guidance when needed\n- Proper documentation\n\n## Common Questions\n\nMany pet owners ask about:\n- When to implement these strategies\n- How often to perform tasks\n- What signs to watch for\n- When to seek professional help\n\n## Conclusion\n\nProper ${subcategory.replace(/-/g, " ")} is essential for your pet's wellbeing. With consistent effort and attention to detail, you can provide excellent care.`

          const likes = Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => String((j % 4) + 1))

          additionalArticles.push({
            id: String(articleId),
            title: `${title} - Part ${articleNumber}`,
            slug: `${category}-${subcategory}-${articleId}`,
            category: category as "care" | "health" | "training" | "nutrition" | "behavior" | "breeds",
            subcategory,
            species: articleId % 2 === 0 ? ["dog", "cat"] : undefined,
            content,
            authorId,
            views: Math.floor(Math.random() * 2000) + 100,
            likes,
            createdAt: dateStr,
            updatedAt: dateStr,
          })

          articleId++
        }
      })
    })

    return additionalArticles
  })(),
]

// Group Categories
export const mockGroupCategories: GroupCategory[] = [
  {
    id: "cat-dogs",
    name: "Dogs",
    slug: "dogs",
    description: "Groups for dog owners and enthusiasts",
    icon: "🐕",
    color: "#3b82f6",
    groupCount: 8,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-cats",
    name: "Cats",
    slug: "cats",
    description: "Groups for cat owners and enthusiasts",
    icon: "🐱",
    color: "#8b5cf6",
    groupCount: 6,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-birds",
    name: "Birds",
    slug: "birds",
    description: "Groups for bird owners and avian enthusiasts",
    icon: "🐦",
    color: "#10b981",
    groupCount: 4,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-small-pets",
    name: "Small Pets",
    slug: "small-pets",
    description: "Groups for rabbits, hamsters, and other small pets",
    icon: "🐰",
    color: "#f59e0b",
    groupCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-training",
    name: "Training",
    slug: "training",
    description: "Groups focused on pet training and behavior",
    icon: "🎓",
    color: "#ef4444",
    groupCount: 7,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-health",
    name: "Health",
    slug: "health",
    description: "Groups focused on pet health and wellness",
    icon: "🏥",
    color: "#ec4899",
    groupCount: 6,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-adoption",
    name: "Adoption",
    slug: "adoption",
    description: "Groups for pet adoption and rescue",
    icon: "❤️",
    color: "#f97316",
    groupCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-nutrition",
    name: "Nutrition",
    slug: "nutrition",
    description: "Groups focused on pet nutrition and diet",
    icon: "🍽️",
    color: "#06b6d4",
    groupCount: 4,
    createdAt: "2024-01-01T00:00:00Z",
  },
]

// Groups
export const mockGroups: Group[] = [
  {
    id: "grp-1",
    name: "Golden Retriever Owners",
    slug: "golden-retriever-owners",
    description: "A community for golden retriever owners to share experiences, tips, and photos of their beloved companions.",
    type: "open",
    categoryId: "cat-dogs",
    ownerId: "1",
    coverImage: "/dog-cover.jpg",
    avatar: "/golden-retriever-icon.png",
    memberCount: 245,
    topicCount: 89,
    postCount: 1240,
    tags: ["golden-retriever", "dogs", "training", "health"],
    rules: [
      "Be respectful to all members",
      "No spam or self-promotion",
      "Keep posts relevant to golden retrievers",
    ],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-20T14:30:00Z",
  },
  {
    id: "grp-2",
    name: "Persian Cat Lovers",
    slug: "persian-cat-lovers",
    description: "Dedicated to Persian cats - share grooming tips, health advice, and adorable photos!",
    type: "open",
    categoryId: "cat-cats",
    ownerId: "2",
    coverImage: "/cat-cover.jpg",
    avatar: "/persian-cat-icon.png",
    memberCount: 189,
    topicCount: 67,
    postCount: 890,
    tags: ["persian", "cats", "grooming", "health"],
    rules: [
      "Respect all members and their cats",
      "No inappropriate content",
      "Share helpful tips and experiences",
    ],
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-03-18T11:20:00Z",
  },
  {
    id: "grp-3",
    name: "Parrot Enthusiasts",
    slug: "parrot-enthusiasts",
    description: "For parrot owners to discuss care, training, and share their colorful companions!",
    type: "open",
    categoryId: "cat-birds",
    ownerId: "3",
    coverImage: "/bird-cover.jpg",
    avatar: "/parrot-icon.png",
    memberCount: 156,
    topicCount: 54,
    postCount: 623,
    tags: ["parrots", "birds", "training", "care"],
    createdAt: "2024-02-10T12:00:00Z",
    updatedAt: "2024-03-19T15:45:00Z",
  },
  {
    id: "grp-4",
    name: "Rabbit Care Community",
    slug: "rabbit-care-community",
    description: "A supportive community for rabbit owners to share knowledge about proper bunny care.",
    type: "closed",
    categoryId: "cat-small-pets",
    ownerId: "4",
    coverImage: "/rabbit-cover.jpg",
    avatar: "/rabbit-icon.png",
    memberCount: 98,
    topicCount: 42,
    postCount: 345,
    tags: ["rabbits", "small-pets", "care", "health"],
    rules: [
      "Be kind and helpful",
      "Follow proper rabbit care guidelines",
      "No breeding discussions",
    ],
    createdAt: "2024-02-20T08:30:00Z",
    updatedAt: "2024-03-17T10:15:00Z",
  },
  {
    id: "grp-5",
    name: "Dog Training Experts",
    slug: "dog-training-experts",
    description: "Share training techniques, ask questions, and learn from experienced trainers.",
    type: "open",
    categoryId: "cat-training",
    ownerId: "1",
    coverImage: "/training-cover.jpg",
    avatar: "/training-icon.png",
    memberCount: 312,
    topicCount: 156,
    postCount: 2100,
    tags: ["training", "dogs", "behavior", "obedience"],
    createdAt: "2024-01-25T11:00:00Z",
    updatedAt: "2024-03-21T09:30:00Z",
  },
  {
    id: "grp-6",
    name: "Cat Health & Wellness",
    slug: "cat-health-wellness",
    description: "Discuss cat health issues, preventive care, and share veterinary advice.",
    type: "open",
    categoryId: "cat-health",
    ownerId: "2",
    coverImage: "/health-cover.jpg",
    avatar: "/health-icon.png",
    memberCount: 267,
    topicCount: 123,
    postCount: 1456,
    tags: ["health", "cats", "veterinary", "wellness"],
    createdAt: "2024-02-05T14:00:00Z",
    updatedAt: "2024-03-20T16:00:00Z",
  },
  {
    id: "grp-7",
    name: "Rescue & Adoption Network",
    slug: "rescue-adoption-network",
    description: "Connect rescuers, foster families, and adopters. Help pets find their forever homes.",
    type: "open",
    categoryId: "cat-adoption",
    ownerId: "5",
    coverImage: "/adoption-cover.jpg",
    avatar: "/adoption-icon.png",
    memberCount: 423,
    topicCount: 201,
    postCount: 3120,
    tags: ["rescue", "adoption", "foster", "shelter"],
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-03-22T11:20:00Z",
  },
  {
    id: "grp-8",
    name: "Raw Feeding Enthusiasts",
    slug: "raw-feeding-enthusiasts",
    description: "Discuss raw diets, meal planning, and nutritional balance for pets.",
    type: "closed",
    categoryId: "cat-nutrition",
    ownerId: "6",
    coverImage: "/nutrition-cover.jpg",
    avatar: "/nutrition-icon.png",
    memberCount: 134,
    topicCount: 67,
    postCount: 456,
    tags: ["nutrition", "raw-feeding", "diet", "health"],
    createdAt: "2024-02-15T10:30:00Z",
    updatedAt: "2024-03-16T13:45:00Z",
  },
  {
    id: "grp-9",
    name: "Secret Puppy Playdates",
    slug: "secret-puppy-playdates",
    description: "Private group for organizing local puppy playdates and meetups.",
    type: "secret",
    categoryId: "cat-dogs",
    ownerId: "7",
    coverImage: "/playdate-cover.jpg",
    avatar: "/playdate-icon.png",
    memberCount: 45,
    topicCount: 23,
    postCount: 178,
    tags: ["puppies", "playdates", "social"],
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-03-19T12:00:00Z",
  },
  {
    id: "grp-10",
    name: "Senior Pet Care",
    slug: "senior-pet-care",
    description: "Support group for owners of senior pets. Share experiences and care tips.",
    type: "open",
    categoryId: "cat-health",
    ownerId: "8",
    coverImage: "/senior-cover.jpg",
    avatar: "/senior-icon.png",
    memberCount: 198,
    topicCount: 89,
    postCount: 567,
    tags: ["senior-pets", "health", "care", "support"],
    createdAt: "2024-02-28T15:00:00Z",
    updatedAt: "2024-03-18T10:30:00Z",
  },
]

// Group Members
export const mockGroupMembers: GroupMember[] = (() => {
  const members: GroupMember[] = []
  const roles: Array<"owner" | "admin" | "moderator" | "member"> = ["owner", "admin", "moderator", "member"]
  const userIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

  mockGroups.forEach((group, groupIndex) => {
    // Owner
    members.push({
      id: `mem-${group.id}-${group.ownerId}`,
      groupId: group.id,
      userId: group.ownerId,
      role: "owner",
      joinedAt: group.createdAt,
      permissions: {
        canPost: true,
        canComment: true,
        canCreateTopic: true,
        canCreatePoll: true,
        canCreateEvent: true,
        canModerate: true,
        canManageMembers: true,
        canManageSettings: true,
      },
    })

    // Add 10-30 members per group
    const memberCount = Math.floor(Math.random() * 21) + 10
    for (let i = 0; i < memberCount && i < userIds.length; i++) {
      const userId = userIds[i]
      if (userId === group.ownerId) continue

      const role = i === 0 ? "admin" : i === 1 ? "moderator" : "member"
      const joinDate = new Date(group.createdAt)
      joinDate.setDate(joinDate.getDate() + Math.floor(Math.random() * 30))

      members.push({
        id: `mem-${group.id}-${userId}-${i}`,
        groupId: group.id,
        userId,
        role,
        joinedAt: joinDate.toISOString(),
        permissions: {
          canPost: true,
          canComment: true,
          canCreateTopic: true,
          canCreatePoll: role !== "member",
          canCreateEvent: role !== "member",
          canModerate: role === "admin" || role === "moderator",
          canManageMembers: role === "admin",
          canManageSettings: role === "admin",
        },
      })
    }
  })

  return members
})()

// Group Topics
export const mockGroupTopics: GroupTopic[] = (() => {
  const topics: GroupTopic[] = []
  const topicTitles = [
    "Welcome to the Group!",
    "Daily Discussion Thread",
    "Training Tips and Tricks",
    "Health Concerns",
    "Favorite Toys",
    "Grooming Questions",
    "Nutrition Advice",
    "Behavioral Issues",
    "Adoption Stories",
    "Show Your Pet!",
  ]

  let topicId = 1
  mockGroups.forEach((group) => {
    // Create 5-15 topics per group
    const topicCount = Math.floor(Math.random() * 11) + 5
    for (let i = 0; i < topicCount; i++) {
      const createdAt = new Date(group.createdAt)
      createdAt.setDate(createdAt.getDate() + i)

      const isPinned = i === 0
      const isLocked = i === topicCount - 1 && Math.random() > 0.7

      topics.push({
        id: `topic-${topicId++}`,
        groupId: group.id,
        authorId: group.ownerId,
        title: `${topicTitles[i % topicTitles.length]} #${i + 1}`,
        content: `This is topic content for ${group.name}. Members can discuss and share their experiences here.\n\nFeel free to ask questions, share tips, or show off your pets!`,
        isPinned,
        isLocked,
        status: isLocked ? "locked" : "active",
        viewCount: Math.floor(Math.random() * 500) + 50,
        commentCount: Math.floor(Math.random() * 100) + 5,
        reactions: {
          like: ["1", "2", "3"].slice(0, Math.floor(Math.random() * 3) + 1),
          love: ["4", "5"].slice(0, Math.floor(Math.random() * 2)),
          laugh: [],
          wow: [],
          sad: [],
          angry: [],
        },
        tags: [group.tags?.[0] || "general"],
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      })
    }
  })

  return topics
})()

// Group Polls
export const mockGroupPolls: GroupPoll[] = [
  {
    id: "poll-1",
    groupId: "grp-1",
    authorId: "1",
    question: "What's your golden retriever's favorite activity?",
    options: [
      { id: "opt-1", text: "Fetch", voteCount: 45 },
      { id: "opt-2", text: "Swimming", voteCount: 32 },
      { id: "opt-3", text: "Hiking", voteCount: 28 },
      { id: "opt-4", text: "Training", voteCount: 15 },
    ],
    allowMultiple: false,
    isClosed: false,
    voteCount: 120,
    createdAt: "2024-03-15T10:00:00Z",
    updatedAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "poll-2",
    groupId: "grp-2",
    authorId: "2",
    question: "Which grooming products do you use?",
    options: [
      { id: "opt-5", text: "Slicker brush", voteCount: 67 },
      { id: "opt-6", text: "Undercoat rake", voteCount: 45 },
      { id: "opt-7", text: "Grooming comb", voteCount: 38 },
      { id: "opt-8", text: "De-matting tool", voteCount: 22 },
    ],
    allowMultiple: true,
    isClosed: false,
    voteCount: 172,
    createdAt: "2024-03-10T14:00:00Z",
    updatedAt: "2024-03-10T14:00:00Z",
  },
  {
    id: "poll-3",
    groupId: "grp-5",
    authorId: "1",
    question: "What training method do you prefer?",
    options: [
      { id: "opt-9", text: "Positive reinforcement", voteCount: 189 },
      { id: "opt-10", text: "Clicker training", voteCount: 98 },
      { id: "opt-11", text: "Balanced training", voteCount: 45 },
      { id: "opt-12", text: "Traditional methods", voteCount: 12 },
    ],
    allowMultiple: false,
    expiresAt: "2024-04-01T00:00:00Z",
    isClosed: false,
    voteCount: 344,
    createdAt: "2024-03-18T09:00:00Z",
    updatedAt: "2024-03-18T09:00:00Z",
  },
]

// Poll Votes
export const mockPollVotes: PollVote[] = [
  { id: "vote-1", userId: "1", pollId: "poll-1", optionIds: ["opt-1"], votedAt: "2024-03-15T10:30:00Z" },
  { id: "vote-2", userId: "2", pollId: "poll-1", optionIds: ["opt-2"], votedAt: "2024-03-15T11:00:00Z" },
  { id: "vote-3", userId: "3", pollId: "poll-2", optionIds: ["opt-5", "opt-6"], votedAt: "2024-03-10T15:00:00Z" },
]

// Group Events
export const mockGroupEvents: GroupEvent[] = [
  {
    id: "event-1",
    groupId: "grp-1",
    authorId: "1",
    title: "Golden Retriever Meetup",
    description: "Join us for a fun meetup at the dog park! Bring your golden retrievers for some playtime and socialization.",
    startDate: "2024-04-15T10:00:00Z",
    endDate: "2024-04-15T14:00:00Z",
    location: "Central Park Dog Run",
    locationUrl: "https://maps.example.com/central-park",
    rsvpRequired: true,
    maxAttendees: 50,
    attendeeCount: 32,
    coverImage: "/event-cover-1.jpg",
    isCancelled: false,
    createdAt: "2024-03-20T09:00:00Z",
    updatedAt: "2024-03-20T09:00:00Z",
  },
  {
    id: "event-2",
    groupId: "grp-5",
    authorId: "1",
    title: "Training Workshop",
    description: "Professional dog trainer will demonstrate basic obedience techniques. All skill levels welcome!",
    startDate: "2024-04-20T13:00:00Z",
    endDate: "2024-04-20T16:00:00Z",
    location: "Community Center - Room 101",
    rsvpRequired: true,
    maxAttendees: 30,
    attendeeCount: 28,
    isCancelled: false,
    createdAt: "2024-03-18T10:00:00Z",
    updatedAt: "2024-03-18T10:00:00Z",
  },
  {
    id: "event-3",
    groupId: "grp-7",
    authorId: "5",
    title: "Adoption Event",
    description: "Come meet adoptable pets! Multiple rescue organizations will be present with dogs, cats, and small animals.",
    startDate: "2024-04-10T10:00:00Z",
    endDate: "2024-04-10T18:00:00Z",
    location: "City Square",
    rsvpRequired: false,
    attendeeCount: 45,
    isCancelled: false,
    createdAt: "2024-03-15T08:00:00Z",
    updatedAt: "2024-03-15T08:00:00Z",
  },
]

// Event RSVPs
export const mockEventRSVPs: EventRSVP[] = [
  { id: "rsvp-1", userId: "1", eventId: "event-1", status: "going", respondedAt: "2024-03-20T10:00:00Z" },
  { id: "rsvp-2", userId: "2", eventId: "event-1", status: "going", respondedAt: "2024-03-20T11:00:00Z" },
  { id: "rsvp-3", userId: "3", eventId: "event-1", status: "maybe", respondedAt: "2024-03-20T12:00:00Z" },
  { id: "rsvp-4", userId: "4", eventId: "event-2", status: "going", respondedAt: "2024-03-18T11:00:00Z" },
]

// Group Resources
export const mockGroupResources: GroupResource[] = [
  {
    id: "res-1",
    groupId: "grp-1",
    title: "Golden Retriever Care Guide",
    type: "document",
    url: "https://example.com/golden-retriever-guide.pdf",
    description: "Comprehensive guide to golden retriever care, health, and training.",
    uploadedBy: "1",
    category: "Care Guides",
    tags: ["care", "guide", "health"],
    downloadCount: 156,
    createdAt: "2024-03-01T10:00:00Z",
  },
  {
    id: "res-2",
    groupId: "grp-5",
    title: "Training Techniques Resource",
    type: "link",
    url: "https://example.com/training-techniques",
    description: "Helpful website with training techniques and tips.",
    uploadedBy: "1",
    category: "Training",
    tags: ["training", "techniques"],
    createdAt: "2024-03-05T14:00:00Z",
  },
  {
    id: "res-3",
    groupId: "grp-6",
    title: "Cat Health Checklist",
    type: "document",
    url: "https://example.com/cat-health-checklist.pdf",
    description: "Printable checklist for monitoring your cat's health.",
    uploadedBy: "2",
    category: "Health",
    tags: ["health", "checklist"],
    downloadCount: 89,
    createdAt: "2024-03-10T09:00:00Z",
  },
]
