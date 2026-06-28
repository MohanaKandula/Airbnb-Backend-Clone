package com.codingshuttle.projects.airBnbApp.config;

import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.HotelContactInfo;
import com.codingshuttle.projects.airBnbApp.entity.Room;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.enums.Gender;
import com.codingshuttle.projects.airBnbApp.entity.enums.Role;
import com.codingshuttle.projects.airBnbApp.entity.Experience;
import com.codingshuttle.projects.airBnbApp.repository.ExperienceRepository;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.repository.HotelMinPriceRepository;
import com.codingshuttle.projects.airBnbApp.repository.RoomRepository;
import com.codingshuttle.projects.airBnbApp.repository.UserRepository;
import com.codingshuttle.projects.airBnbApp.service.InventoryService;
import com.codingshuttle.projects.airBnbApp.service.PricingUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private static final Set<String> REAL_HOTELS = Set.of(
        "Taj Exotica Resort & Spa Goa",
        "The Taj Mahal Palace Mumbai",
        "The Leela Palace New Delhi",
        "Taj Lake Palace Udaipur",
        "The Leela Palace Bengaluru",
        "The Oberoi Grand Kolkata",
        "Kumarakom Lake Resort",
        "The Oberoi Amarvilas Agra",
        "Taj Fisherman's Cove Resort & Spa Chennai",
        "Taj Falaknuma Palace Hyderabad"
    );

    private static final Set<String> REAL_HOTELS_STATES = Set.of(
        "Goa", "Maharashtra", "Delhi", "Rajasthan", "Karnataka", "West Bengal", "Kerala", "Uttar Pradesh", "Tamil Nadu", "Telangana"
    );

    private static final String[][] HOTEL_PHOTO_POOL = {
        {
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"
        },
        {
            "https://images.unsplash.com/photo-1596494819308-9c10f5e19b45?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
        },
        {
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=600&q=80"
        },
        {
            "https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"
        },
        {
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"
        }
    };

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final InventoryService inventoryService;
    private final PricingUpdateService pricingUpdateService;
    private final PasswordEncoder passwordEncoder;
    private final HotelMinPriceRepository hotelMinPriceRepository;
    private final ExperienceRepository experienceRepository;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Checking database state for seeding...");

        String[] states = {
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
            "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
            "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
            "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
        };

        // Rename any existing hotels with the old naming format to the new realistic ones
        renameOldSeededHotels(states);

        // If the database already has at least 145 hotels, skip seeding completely
        if (hotelRepository.count() >= 145) {
            log.info("Database already seeded with 5+ hotels per state (Total hotels: {}). Skipping initial seeding process.", hotelRepository.count());
            log.info("Triggering updatePrices() on startup to ensure HotelMinPrice records are fresh...");
            pricingUpdateService.updatePrices();
            return;
        }

        log.info("Starting database seeding for 28 States + Delhi...");

        // 1. Seed State Managers
        for (String state : states) {
            String email = state.toLowerCase().replace(" ", "") + "@gmail.com";
            getOrCreateManager(email, state + " Manager");
        }

        // Seed Guest User
        if (userRepository.findByEmail("guest@example.com").isEmpty()) {
            User guest = new User();
            guest.setEmail("guest@example.com");
            guest.setPassword(passwordEncoder.encode("password"));
            guest.setName("Jane Guest");
            guest.setGender(Gender.FEMALE);
            guest.setDateOfBirth(LocalDate.of(1990, 5, 15));
            guest.setRoles(Set.of(Role.GUEST));
            guest.setEmailVerified(true);
            userRepository.save(guest);
            log.info("Seeded Guest user: guest@example.com");
        } else {
            log.info("Guest user guest@example.com already exists. Skipping seeding.");
        }

        // Retrieve Goa manager for experiences seeding
        User managerGoa = userRepository.findByEmail("goa@gmail.com").orElseThrow();

        // 2. Seed 10 Real Premium Hotels
        seedRealHotel("Taj Exotica Resort & Spa Goa", "Benaulim", "Goa",
                "Benaulim Beach, Benaulim, Goa 403716", "15.2489, 73.9278",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Spa Therapy", "Valet Parking", "Fine Dining"},
                new String[]{
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"
                }, 8500, 18000);

        seedRealHotel("The Taj Mahal Palace Mumbai", "Mumbai", "Maharashtra",
                "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001", "18.9219, 72.8333",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Fitness Center", "Fine Dining", "Lounge Bar"},
                new String[]{
                    "https://images.unsplash.com/photo-1596494819308-9c10f5e19b45?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
                }, 12000, 35000);

        seedRealHotel("The Leela Palace New Delhi", "New Delhi", "Delhi",
                "Diplomatic Enclave, Chanakyapuri, New Delhi 110023", "28.6019, 77.1890",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Spa Therapy", "Fine Dining", "Sky Bar"},
                new String[]{
                    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=600&q=80"
                }, 9500, 25000);

        seedRealHotel("Taj Lake Palace Udaipur", "Udaipur", "Rajasthan",
                "Pichola, Udaipur, Rajasthan 313001", "24.5756, 73.6800",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Fine Dining", "Spa Therapy", "Lounge Bar"},
                new String[]{
                    "https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"
                }, 15000, 45000);

        seedRealHotel("The Leela Palace Bengaluru", "Bengaluru", "Karnataka",
                "23, HAL Old Airport Rd, Bengaluru, Karnataka 560008", "12.9606, 77.6484",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Fitness Center", "Valet Parking", "Fine Dining"},
                new String[]{
                    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"
                }, 7500, 22000);

        seedRealHotel("The Oberoi Grand Kolkata", "Kolkata", "West Bengal",
                "15, Jawaharlal Nehru Rd, Kolkata 700013", "22.5600, 88.3516",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Valet Parking", "Fine Dining", "Lounge Bar"},
                new String[]{
                    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
                }, 6800, 18500);

        seedRealHotel("Kumarakom Lake Resort", "Kumarakom", "Kerala",
                "Kottayam, Kumarakom, Kerala 686563", "9.5934, 76.4225",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Spa Therapy", "Fine Dining", "Sky Bar"},
                new String[]{
                    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1570168007244-23704139443d?auto=format&fit=crop&w=600&q=80"
                }, 9800, 28000);

        seedRealHotel("The Oberoi Amarvilas Agra", "Agra", "Uttar Pradesh",
                "Taj East Gate Rd, Agra, Uttar Pradesh 282001", "27.1682, 78.0489",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Fitness Center", "Spa Therapy", "Fine Dining"},
                new String[]{
                    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80"
                }, 14000, 40000);

        seedRealHotel("Taj Fisherman's Cove Resort & Spa Chennai", "Chennai", "Tamil Nadu",
                "Covelong Beach, Kancheepuram, Chennai 603112", "12.7844, 80.2520",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Spa Therapy", "Valet Parking", "Fine Dining", "Lounge Bar"},
                new String[]{
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                }, 8000, 20000);

        seedRealHotel("Taj Falaknuma Palace Hyderabad", "Hyderabad", "Telangana",
                "Engine Bowli, Falaknuma, Hyderabad, Telangana 500053", "17.3315, 78.4678",
                new String[]{"Free WiFi", "Air Conditioning", "Swimming Pool", "Fitness Center", "Fine Dining", "Sky Bar", "Spa Therapy"},
                new String[]{
                    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80"
                }, 16000, 50000);

        // 3. Seed generated hotels to ensure each state manager owns exactly 5 hotels
        log.info("Generating and seeding additional hotels so every state has exactly 5 hotels...");
        seedAllStatesToFiveHotels(states);

        // 4. Immediately trigger calculation of dynamic prices and populate HotelMinPrice
        log.info("Calculating dynamic prices and seeding HotelMinPrice...");
        pricingUpdateService.updatePrices();

        // 4. Seed Experiences
        seedExperiences(managerGoa);

        log.info("Database seeding successfully completed!");
    }

    private User getOrCreateManager(String email, String name) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("123456"));
            user.setName(name);
            user.setGender(Gender.MALE);
            user.setDateOfBirth(LocalDate.of(1985, 10, 10));
            user.setRoles(Set.of(Role.HOTEL_MANAGER, Role.GUEST));
            user.setEmailVerified(true);
            user = userRepository.save(user);
            log.info("Seeded Hotel Manager user: {}", email);
        }
        return user;
    }

    private void seedRealHotel(String name, String city, String state, String address, String location,
                               String[] amenities, String[] photos, double deluxePrice, double suitePrice) {
        String email = state.toLowerCase().replace(" ", "") + "@gmail.com";
        User owner = userRepository.findByEmail(email).orElse(null);
        if (owner == null) return;

        if (owner != null && !Boolean.TRUE.equals(owner.getIsVerifiedHost())) {
            owner.setIsVerifiedHost(true);
            userRepository.save(owner);
        }

        if (hotelRepository.existsByName(name)) {
            log.info("Hotel '{}' already exists. Skipping seeding.", name);
            return;
        }

        Hotel hotel = new Hotel();
        hotel.setName(name);
        hotel.setCity(city);
        hotel.setState(state);
        hotel.setActive(true);
        hotel.setOwner(owner);
        hotel.setAmenities(amenities);
        hotel.setPhotos(photos);
        hotel.setRating(4.5 + (name.length() % 5) * 0.1);

        double[] coords = getApproximateCoordinates(state, name.hashCode() % 5);
        hotel.setLatitude(coords[0]);
        hotel.setLongitude(coords[1]);

        HotelContactInfo contactInfo = new HotelContactInfo();
        contactInfo.setAddress(address);
        contactInfo.setEmail("contact@" + name.toLowerCase().replaceAll("[^a-z]", "") + ".com");
        contactInfo.setPhoneNumber("+91 98765 43210");
        contactInfo.setLocation(coords[0] + ", " + coords[1]);
        hotel.setContactInfo(contactInfo);

        hotel = hotelRepository.save(hotel);

        // Seed Rooms
        // Deluxe Room
        Room deluxe = new Room();
        deluxe.setHotel(hotel);
        deluxe.setType("Deluxe Room");
        deluxe.setBasePrice(BigDecimal.valueOf(deluxePrice));
        deluxe.setCapacity(2);
        deluxe.setTotalCount(10);
        deluxe.setAmenities(new String[]{"Free WiFi", "Air Conditioning", "Flat-screen TV"});
        deluxe.setPhotos(new String[]{
                "https://images.unsplash.com/photo-1611891404724-59912444e6a8?auto=format&fit=crop&w=600&q=80"
        });
        deluxe = roomRepository.save(deluxe);
        inventoryService.initializeRoomForAYear(deluxe);

        // Presidential Suite
        Room suite = new Room();
        suite.setHotel(hotel);
        suite.setType("Presidential Suite");
        suite.setBasePrice(BigDecimal.valueOf(suitePrice));
        suite.setCapacity(4);
        suite.setTotalCount(4);
        suite.setAmenities(new String[]{"Free WiFi", "Air Conditioning", "Flat-screen TV", "Mini Bar", "Luxury Bathtub"});
        suite.setPhotos(new String[]{
                "https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&w=600&q=80"
        });
        suite = roomRepository.save(suite);
        inventoryService.initializeRoomForAYear(suite);

        log.info("Rooms and inventories initialized for: {}", name);
    }

    private void seedExperiences(User host) {
        if (experienceRepository.count() > 0) {
            log.info("Experiences already seeded. Skipping experience seeding.");
            return;
        }

        log.info("Seeding Experiences and Online Experiences...");

        // In-Person Experiences
        createExperience("Scuba Diving & Coral Reef Exploration",
                "Dive into the crystal clear waters of Goa! Explore shipwrecks, swim alongside exotic marine life, and witness stunning coral reefs. Guided by PADI certified instructors. Equipment and snacks included.",
                "Goa", BigDecimal.valueOf(3500), "4 hours",
                "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
                false, 4.8, 8, host);

        createExperience("Old Delhi Street Food & Historical Heritage Walk",
                "Taste the legendary spices of Delhi! Journey through the narrow alleyways of Chandni Chowk, sampling iconic food like paranthas, jalebi, and chaat, while learning the Mughal history of the Walled City.",
                "Delhi", BigDecimal.valueOf(1200), "3 hours",
                "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
                false, 4.9, 12, host);

        createExperience("Bollywood Dance & Film Studio Tour",
                "Step into the magical world of Indian Cinema! Get a behind-the-scenes look at active film sets in Mumbai, and learn a fun, energetic Bollywood dance choreography from industry choreographers.",
                "Mumbai", BigDecimal.valueOf(2500), "3 hours",
                "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
                false, 4.7, 15, host);

        createExperience("Microbrewery Crawl & Craft Beer Tasting",
                "Explore the silicon valley's thriving beer culture! Visit three award-winning craft microbreweries in Bangalore. Sample unique IPAs, stouts, and ales, paired with delicious local appetizers.",
                "Bangalore", BigDecimal.valueOf(1800), "4 hours",
                "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&w=600&q=80",
                false, 4.6, 10, host);

        createExperience("Traditional Bengali Cooking & Market Tour",
                "Discover the secrets of Bengali mustard fish curry and sandesh sweets! Buy fresh local ingredients at a bustling Kolkata bazaar, then cook a traditional 5-course meal in a local heritage home.",
                "Kolkata", BigDecimal.valueOf(1500), "5 hours",
                "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
                false, 4.9, 6, host);

        createExperience("Amber Fort Photography & Royal Heritage Walk",
                "Capture the majestic Pink City through your lens! Walk through royal chambers, secret passages, and panoramic viewpoints in Jaipur. Guided by a professional travel photographer.",
                "Jaipur", BigDecimal.valueOf(1600), "3 hours",
                "https://images.unsplash.com/photo-1477584322811-53475141e180?auto=format&fit=crop&w=600&q=80",
                false, 4.8, 8, host);

        // Online Experiences (Virtual)
        createExperience("Virtual Yoga & Meditation with Himalayan Yogi",
                "Find your inner peace live from Rishikesh. Practice authentic pranayama, gentle yoga flows, and a deep guided mindfulness meditation session to clear mental blocks and stress.",
                "Online", BigDecimal.valueOf(600), "1.5 hours",
                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80",
                true, 4.9, 30, host);

        createExperience("Authentic Italian Pasta-Making Class Live from Rome",
                "Learn to cook fresh handmade fettuccine and classic carbonara sauce from a passionate Italian grandmother. Receive an ingredient prep list and cook along in real-time over Zoom.",
                "Online", BigDecimal.valueOf(950), "2 hours",
                "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
                true, 4.9, 25, host);

        createExperience("Interactive Mystery Magic & Illusion Show",
                "A mind-bending online magic show that happens in your own hands! Interactive sleight-of-hand, psychological illusions, and mind-reading tricks perfect for family and team building.",
                "Online", BigDecimal.valueOf(800), "1 hour",
                "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&w=600&q=80",
                true, 4.7, 50, host);

        log.info("Experiences successfully seeded!");
    }

    private void createExperience(String title, String description, String location, BigDecimal price,
                                  String duration, String image, boolean isOnline, double rating,
                                  int maxGuests, User host) {
        Experience exp = new Experience();
        exp.setTitle(title);
        exp.setDescription(description);
        exp.setLocation(location);
        exp.setPrice(price);
        exp.setDuration(duration);
        exp.setImage(image);
        exp.setIsOnline(isOnline);
        exp.setRating(rating);
        exp.setMaxGuests(maxGuests);
        exp.setHost(host);
        experienceRepository.save(exp);
    }

    private void renameOldSeededHotels(String[] states) {
        log.info("Checking for old seeded generated hotels that need renaming to be more realistic...");
        int renameCount = 0;
        for (String state : states) {
            String email = state.toLowerCase().replace(" ", "") + "@gmail.com";
            User owner = userRepository.findByEmail(email).orElse(null);
            if (owner == null) continue;

            // Fetch all hotels owned by this owner
            java.util.List<Hotel> existingHotels = hotelRepository.findByOwner(owner);
            
            // Separate real hotels and generated hotels
            java.util.List<Hotel> generatedHotels = new java.util.ArrayList<>();
            for (Hotel h : existingHotels) {
                if (!REAL_HOTELS.contains(h.getName())) {
                    generatedHotels.add(h);
                }
            }
            
            // Sort generated hotels by ID so index mapping is stable
            generatedHotels.sort(java.util.Comparator.comparing(Hotel::getId));
            
            for (int i = 0; i < generatedHotels.size(); i++) {
                String city = getDefaultCity(state, i);
                String newName = generateRealisticHotelName(state, city, i);
                
                Hotel hotel = generatedHotels.get(i);
                if (!hotel.getName().equals(newName)) {
                    log.info("Renaming old seeded hotel from '{}' to '{}' in state '{}'", hotel.getName(), newName, state);
                    hotel.setName(newName);
                    
                    // Also update contact info email to match new name
                    if (hotel.getContactInfo() != null) {
                        hotel.getContactInfo().setEmail("contact@" + newName.toLowerCase().replaceAll("[^a-z0-9]", "") + ".com");
                    }
                    
                    hotelRepository.save(hotel);
                    renameCount++;
                }
            }
        }
        if (renameCount > 0) {
            log.info("Successfully renamed {} generated hotels to follow realistic naming patterns.", renameCount);
        } else {
            log.info("No old seeded hotels needed renaming.");
        }
    }

    private String generateRealisticHotelName(String state, String city, int index) {
        String[] adjectives = {
            "Royal", "Serene", "Whispering Pines", "Golden", "Emerald", "Azure", "Mystic",
            "Heritage", "Grand Vista", "Wildflower", "Sun & Sand", "Coastal Breeze", "Urban Oasis",
            "Pinewood", "Saffron", "Vedic Wellness", "Oakwood", "Hilltop", "Valley View", "Elixir",
            "Lotus", "Marigold", "Dew Drops", "Silver Oaks", "Blue Lagoon", "Orchard", "Ginger",
            "Cascade", "Cloud Nine", "Solitude", "Tranquil", "Elysian", "Jasmine", "Cinnamon", "Pepper"
        };
        
        String[] nouns = {
            "Retreat", "Palace", "Mansion", "Villas", "Haven", "Manor", "Sanctuary", "Orchard",
            "Abode", "Lodge", "Hideaway", "Nest", "Castle", "House", "Residency", "Heights", "Cottages"
        };

        String[] suffixes = {
            "Resort & Spa", "Boutique Hotel", "Heritage Stay", "Homestay", "Luxury Suites",
            "Eco Lodge", "Villas", "Resort", "Inn", "Wellness Center"
        };

        String[] premiumBrands = {
            "Taj", "The Leela Palace", "The Oberoi", "Radisson Blu", "Hyatt Regency",
            "Sheraton", "Marriott", "ITC Grand", "Novotel", "Vivanta", "Westin", "Trident",
            "Hilton", "Hyatt Centric", "DoubleTree by Hilton"
        };

        // Use a deterministic hash of state + index to choose
        int hash = Math.abs((state + index).hashCode());
        
        // Choose pattern based on index to ensure diversity within the same state
        int pattern = index % 5;
        switch (pattern) {
            case 0: {
                String brand = premiumBrands[hash % premiumBrands.length];
                if (brand.startsWith("The ")) {
                    return brand + ", " + city;
                }
                return "The " + brand + ", " + city;
            }
            case 1:
                return adjectives[hash % adjectives.length] + " " + nouns[(hash + 1) % nouns.length] + ", " + city;
            case 2:
                return adjectives[hash % adjectives.length] + " " + suffixes[(hash + 2) % suffixes.length] + ", " + city;
            case 3:
                return "The " + nouns[hash % nouns.length] + " " + suffixes[(hash + 3) % suffixes.length] + ", " + city;
            case 4:
            default: {
                String brand = premiumBrands[hash % premiumBrands.length];
                return brand + " " + nouns[(hash + 4) % nouns.length] + ", " + city;
            }
        }
    }

    private void seedAllStatesToFiveHotels(String[] states) {
        for (String state : states) {
            String email = state.toLowerCase().replace(" ", "") + "@gmail.com";
            User owner = userRepository.findByEmail(email).orElse(null);
            if (owner == null) continue;

            java.util.List<Hotel> existingHotels = hotelRepository.findByOwner(owner);
            
            // Filter to get only the generated ones
            java.util.List<Hotel> generatedHotels = new java.util.ArrayList<>();
            for (Hotel h : existingHotels) {
                if (!REAL_HOTELS.contains(h.getName())) {
                    generatedHotels.add(h);
                }
            }
            
            int existingCount = generatedHotels.size();
            int maxGeneratedNeed = REAL_HOTELS_STATES.contains(state) ? 4 : 5;
            
            if (existingCount >= maxGeneratedNeed) {
                log.info("State {} already has {} generated hotels. Skipping generation.", state, existingCount);
                continue;
            }

            int hotelsToCreate = maxGeneratedNeed - existingCount;
            log.info("Generating {} new diverse hotels for state: {}", hotelsToCreate, state);
            for (int i = 0; i < hotelsToCreate; i++) {
                int index = existingCount + i;
                String city = getDefaultCity(state, index);
                String name = generateRealisticHotelName(state, city, index);
                
                String address = "Premium Address St " + (index + 1) + ", " + city + ", " + state + " 5000" + index;
                String location = "15.0000, 75.0000";
                
                String[] amenities = {"Free WiFi", "Air Conditioning", "Swimming Pool", "Spa Therapy", "Valet Parking", "Fine Dining"};
                String[] photos = HOTEL_PHOTO_POOL[index % HOTEL_PHOTO_POOL.length];
                
                double deluxePrice = 3500.0 + (index * 1100.0);
                double suitePrice = 9000.0 + (index * 2500.0);
                
                seedRealHotel(name, city, state, address, location, amenities, photos, deluxePrice, suitePrice);
            }
        }
    }

    private String getDefaultCity(String state, int index) {
        switch (state) {
            case "Andhra Pradesh":
                return new String[]{"Visakhapatnam", "Vijayawada", "Tirupati", "Guntur", "Nellore"}[index % 5];
            case "Arunachal Pradesh":
                return new String[]{"Itanagar", "Tawang", "Ziro", "Pasighat", "Bomdila"}[index % 5];
            case "Assam":
                return new String[]{"Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"}[index % 5];
            case "Bihar":
                return new String[]{"Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Nalanda"}[index % 5];
            case "Chhattisgarh":
                return new String[]{"Raipur", "Bhilai", "Bilaspur", "Korba", "Jagdalpur"}[index % 5];
            case "Goa":
                return new String[]{"Panaji", "Margao", "Vasco da Gama", "Calangute", "Baga"}[index % 5];
            case "Gujarat":
                return new String[]{"Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"}[index % 5];
            case "Haryana":
                return new String[]{"Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"}[index % 5];
            case "Himachal Pradesh":
                return new String[]{"Shimla", "Manali", "Dharamshala", "Kasauli", "Dalhousie"}[index % 5];
            case "Jharkhand":
                return new String[]{"Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"}[index % 5];
            case "Karnataka":
                return new String[]{"Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Hampi"}[index % 5];
            case "Kerala":
                return new String[]{"Kochi", "Trivandrum", "Munnar", "Alappuzha", "Wayanad"}[index % 5];
            case "Madhya Pradesh":
                return new String[]{"Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"}[index % 5];
            case "Maharashtra":
                return new String[]{"Mumbai", "Pune", "Nagpur", "Nashik", "Lonavala"}[index % 5];
            case "Manipur":
                return new String[]{"Imphal", "Ukhrul", "Bishnupur", "Churachandpur", "Senapati"}[index % 5];
            case "Meghalaya":
                return new String[]{"Shillong", "Cherrapunji", "Tura", "Jowai", "Nongpoh"}[index % 5];
            case "Mizoram":
                return new String[]{"Aizawl", "Lunglei", "Champhai", "Kolasib", "Serchhip"}[index % 5];
            case "Nagaland":
                return new String[]{"Kohima", "Dimapur", "Mokokchung", "Wokha", "Tuensang"}[index % 5];
            case "Odisha":
                return new String[]{"Bhubaneswar", "Puri", "Cuttack", "Rourkela", "Konark"}[index % 5];
            case "Punjab":
                return new String[]{"Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"}[index % 5];
            case "Rajasthan":
                return new String[]{"Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar"}[index % 5];
            case "Sikkim":
                return new String[]{"Gangtok", "Pelling", "Lachung", "Namchi", "Ravangla"}[index % 5];
            case "Tamil Nadu":
                return new String[]{"Chennai", "Coimbatore", "Madurai", "Ooty", "Kodaikanal"}[index % 5];
            case "Telangana":
                return new String[]{"Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"}[index % 5];
            case "Tripura":
                return new String[]{"Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Ambassa"}[index % 5];
            case "Uttar Pradesh":
                return new String[]{"Lucknow", "Varanasi", "Agra", "Kanpur", "Prayagraj"}[index % 5];
            case "Uttarakhand":
                return new String[]{"Dehradun", "Rishikesh", "Haridwar", "Nainital", "Mussoorie"}[index % 5];
            case "West Bengal":
                return new String[]{"Kolkata", "Darjeeling", "Siliguri", "Digha", "Kalimpong"}[index % 5];
            case "Delhi":
                return new String[]{"New Delhi", "South Delhi", "North Delhi", "Dwarka", "Rohini"}[index % 5];
            default:
                return state + " City";
        }
    }

    private double[] getApproximateCoordinates(String state, int index) {
        double lat = 20.5937; // Center of India fallback
        double lng = 78.9629;
        
        switch (state) {
            case "Andhra Pradesh": lat = 16.5062; lng = 80.6480; break;
            case "Arunachal Pradesh": lat = 27.1020; lng = 93.6160; break;
            case "Assam": lat = 26.1445; lng = 91.7362; break;
            case "Bihar": lat = 25.5941; lng = 85.1376; break;
            case "Chhattisgarh": lat = 21.2787; lng = 81.8661; break;
            case "Goa": lat = 15.2993; lng = 74.1240; break;
            case "Gujarat": lat = 23.0225; lng = 72.5714; break;
            case "Haryana": lat = 29.0588; lng = 76.0856; break;
            case "Himachal Pradesh": lat = 31.1048; lng = 77.1734; break;
            case "Jharkhand": lat = 23.3441; lng = 85.3096; break;
            case "Karnataka": lat = 12.9716; lng = 77.5946; break;
            case "Kerala": lat = 10.8505; lng = 76.2711; break;
            case "Madhya Pradesh": lat = 22.9734; lng = 78.6569; break;
            case "Maharashtra": lat = 19.0760; lng = 72.8777; break;
            case "Manipur": lat = 24.6637; lng = 93.9063; break;
            case "Meghalaya": lat = 25.4670; lng = 91.3662; break;
            case "Mizoram": lat = 23.1645; lng = 92.9376; break;
            case "Nagaland": lat = 26.1584; lng = 94.5624; break;
            case "Odisha": lat = 20.2961; lng = 85.8245; break;
            case "Punjab": lat = 31.1471; lng = 75.3412; break;
            case "Rajasthan": lat = 26.9124; lng = 75.7873; break;
            case "Sikkim": lat = 27.3314; lng = 88.6138; break;
            case "Tamil Nadu": lat = 13.0827; lng = 80.2707; break;
            case "Telangana": lat = 17.3850; lng = 78.4867; break;
            case "Tripura": lat = 23.8315; lng = 91.2868; break;
            case "Uttar Pradesh": lat = 26.8467; lng = 80.9462; break;
            case "Uttarakhand": lat = 30.0668; lng = 79.0193; break;
            case "West Bengal": lat = 22.5726; lng = 88.3639; break;
            case "Delhi": lat = 28.6139; lng = 77.2090; break;
            case "Jammu & Kashmir": lat = 34.0837; lng = 74.7973; break;
            case "Ladakh": lat = 34.1526; lng = 77.5771; break;
            case "Puducherry": lat = 11.9416; lng = 79.8083; break;
            case "Andaman & Nicobar Islands": case "Andaman and Nicobar": lat = 11.7401; lng = 92.6586; break;
            case "Chandigarh": lat = 30.7333; lng = 76.7794; break;
            case "Dadra & Nagar Haveli and Daman & Diu": case "Dadra & Nagar Haveli": lat = 20.2765; lng = 73.0083; break;
            case "Lakshadweep": lat = 10.5667; lng = 72.6417; break;
        }

        // Apply a small offset based on the index to scatter pins slightly
        double offsetLat = (index - 2) * 0.05;
        double offsetLng = (index - 2) * 0.05;
        
        return new double[]{lat + offsetLat, lng + offsetLng};
    }
}
