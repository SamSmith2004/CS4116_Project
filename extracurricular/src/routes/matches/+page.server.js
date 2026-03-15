const requests = [
    {
        id: 101,
        name: 'Ciara Walsh',
        age: 22,
        university: 'University College Cork',
        course: 'Psychology',
        bio: 'Coffee-fueled psychology student who loves long walks and meaningful chats.',
        interests: ['Yoga', 'Coffee', 'Podcasts'],
        imageUrl: '/images/logo.png'
    },
    {
        id: 102,
        name: 'Rory Flanagan',
        age: 24,
        university: 'NUI Galway',
        course: 'Physics',
        bio: 'Into astronomy, weekend cycling, and finding the best indie film nights.',
        interests: ['Cycling', 'Chess', 'Sci-Fi'],
        imageUrl: '/images/logo.png'
    },
    {
        id: 103,
        name: 'Siobhan Doyle',
        age: 21,
        university: 'University of Limerick',
        course: 'Biomedical Engineering',
        bio: 'Builder at heart. I enjoy design projects, volunteering, and staying active.',
        interests: ['Swimming', 'Design', 'Volunteering'],
        imageUrl: '/images/logo.png'
    }
];

const recommendations = [
    {
        id: 201,
        name: 'Tadhg Brennan',
        age: 23,
        university: 'Dublin Institute of Technology',
        course: 'Software Development',
        bio: 'Startup-minded dev who alternates between coding sessions and pickup basketball.',
        interests: ['Startups', 'Basketball', 'Gaming'],
        imageUrl: '/images/logo.png'
    },
    {
        id: 202,
        name: 'Aoife Kavanagh',
        age: 20,
        university: 'Maynooth University',
        course: 'Mathematics',
        bio: 'Math student with a soft spot for piano evenings and trail hikes.',
        interests: ['Piano', 'Hiking', 'Films'],
        imageUrl: '/images/logo.png'
    },
    {
        id: 203,
        name: 'Sean Connolly',
        age: 25,
        university: 'Trinity College Dublin',
        course: 'Economics',
        bio: 'Curious traveler and book collector always up for tennis and good conversation.',
        interests: ['Travel', 'Reading', 'Tennis'],
        imageUrl: '/images/logo.png'
    }
];

const universityTintMap = {
    'University of Limerick': '#e6ffe6',
    'University College Cork': '#fff3e6',
    'NUI Galway': '#f2ecff',
    'Dublin Institute of Technology': '#e6f4ff',
    'Maynooth University': '#f5f0ff',
    'Trinity College Dublin': '#e8f4ff'
};

export const load = async () => {
    return {
        requests,
        recommendations,
        universityTintMap
    };
};
