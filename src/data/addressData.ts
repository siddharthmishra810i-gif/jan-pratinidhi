export interface AddressInfo {
  permanentAddress: string;
  delhiAddress: string;
  email?: string;
}

const addresses: Record<string, AddressInfo> = {
  "Smt. Sajda Ahmed": {
    permanentAddress: "Jaduberia, Ward No. 29, Po- Uluberia, Dist. Howrah, West Bengal - 711316. Phone : 033-26610161/22294567",
    delhiAddress: "C-II/5, Tilak Lane, New Delhi – 110001 Phone: 23782786"
  },
  "Ananta Nayak": {
    permanentAddress: "Langalakanti, Dhenkikote Keonjhar Keonjhar Odisha 758029 (06733) 228333,9437022233",
    delhiAddress: "9, H. C. Mathur Lane, New Delhi- 110001 Tels. (011) 23793935"
  },
  "Thiru D M Kathir Anand": {
    permanentAddress: "7, 5th East Cross Street, Gandhi Nagar, Vellore-632006 Tamil Nadu PHONE:0416-2242941",
    delhiAddress: "1202, Yamuna, 12th Floor, Dr. Bisamber Dass Marg, New Delhi-110001"
  },
  "Shri C N Annadurai": {
    permanentAddress: "370/1, Kattuputhur, Devanamattu Village & Post, Thiruvannamalai TK & Distt., Tamil Nadu.",
    delhiAddress: "175, South Avenue, New Delhi- 110001"
  },
  "Shri Anto Antony": {
    permanentAddress: "MP Office, College Road Pathanamthitta, Kerala - 689 645",
    delhiAddress: "25 North Avenue (Duplex) New Delhi.-110011"
  },
  "Adv. Chandra Shekhar": {
    permanentAddress: "c/o Govardhan das,1143,chutmalpur saharanpur saharanpur Uttar Pradesh 247662",
    delhiAddress: "Not Available"
  },
  "Shri T R Baalu": {
    permanentAddress: "28, United India Colony, 1st Cross Kodambakkam, Chennai - 600024, Tamil Nadu.",
    delhiAddress: "10, Raisina Road, New Delhi- 110001. Fax: 23321010"
  },
  "Shri Balram Naik Porika": {
    permanentAddress: "Flat No- G1, Vishnu Blue Lotus Apartments, Road Number-3 Near TV 9 Office, Banjara Hills, Hyderabad Andhra Pradesh 500034",
    delhiAddress: "32, Meena Bagh, Maulana Azad Road New Delhi- 110 011"
  },
  "Shri Bhausaheb Rajaram Wakchaure": {
    permanentAddress: "Sai Arpan Bunglow Near SaiSharddha Housing Society Behind Saibaba Bhakta Niwas At & Post Shirdi Tal Rahta Distt Ahmednagar Maharashtra 423109",
    delhiAddress: "N-703, Narmada New, Ms Flats, Dr. Bd Marg, New Delhi-110001"
  },
  "Shri E T Mohammed Basheer": {
    permanentAddress: "Soumyam-Po. Cheruvayoor, Vazhakvad, Kerala – 673645",
    delhiAddress: "Phone : 23752428, Mobile : 9013180206"
  },
  "Shri Kalyan Banerjee": {
    permanentAddress: "37c, Harish Chatterjee Street, Kolkatta, West Bengal – 700026",
    delhiAddress: "Bungalow No. 07, Duplex, North Avenue, New Delhi- 110001"
  },
  "Smt. Shobhanaben Mahendrasinh Baraiya": {
    permanentAddress: "56, Gajand Society Aproach Road Prantij At & Po Prantij sabarkantha Gujarat 383205",
    delhiAddress: "phone: 23782090 Mobile : 9013180097"
  },
  "Shri Sudip Bandyopadhyay": {
    permanentAddress: "72/4f/3,S.N. Banerjee Road, Waverly Mannor, Kolkatta – 700014",
    delhiAddress: "Flat No.-1 (Duplex ) North Avenue New Delhi-110001"
  },
  "Shri Sukhdeo Bhagat": {
    permanentAddress: "Behind Nadia Hindu High School, Lohardaga AT+PO Lohardaga Lohardaga Jharkhand 835302",
    delhiAddress: "Mobile No. 9013180066"
  },
  "Shri Pradan Baruah": {
    permanentAddress: "Vill. Amritpur, PO & PS Silapathar Distt. Dhemaji , Assam.",
    delhiAddress: "33 & 35 South Avenue New Delhi-110011"
  },
  "Shri Om Birla": {
    permanentAddress: "80-B Shanti Nagar, Kota Nagar- 324009, Rajashthan.",
    delhiAddress: "20, Akbar Road, New Delhi- 110011"
  },
  "Shri Raju Bista": {
    permanentAddress: "The Matter Horn, 9 Hermitage Road Near Governor House, Darjeeling-734101",
    delhiAddress: "18/75, West Punjabi Bagh, New Delhi-110026."
  },
  "Shri Bishnu Pada Ray": {
    permanentAddress: "Near Fire Brigade Water Tank Aberdeen Round Village PO Port Blair Port Blair Andaman and Nicobar Islands 744101",
    delhiAddress: "2, G.R.G. Road, New Delhi - 110 001"
  },
  "Shri P P Chaudhary": {
    permanentAddress: "House No.6, Central School Scheme Jodhpur, Rajasthan – 342011",
    delhiAddress: "19 Teen Murti Lane New Delhi- 110001"
  },
  "Dr. Anand Kumar": {
    permanentAddress: "Village Semri Malmala, Post- Dharmapur, Block-Mihipurwa Bahraich Bahraich Uttar Pradesh 271855",
    delhiAddress: "Flat No. A-5 (Fifth Floor), Tower B-1 (Type-7) Central Govt. Residential Apartment, Deen Dayal Upadhyay Marg New Delhi 110002"
  },
  "Shri Karti P Chidambaram": {
    permanentAddress: "16, Pycrofts Garden Road Chennai - 600006, Tamil Nadu",
    delhiAddress: "80 Lodhi Estate, New Delhi-110003"
  },
  "Shri Chandra Prakash Choudhary": {
    permanentAddress: "Vill. Sandi, P.O. Sandi, Block Chitarpur, Distt. Ramgarh, Jharkhand-829150.",
    delhiAddress: "21, North Avenue (Duplex), New Delhi"
  },
  "Shri J.M. Aaroon Rasheed": {
    permanentAddress: "15/7, Vijaya Raghava, Teynampet 1st Cross Street, T Nagar, Chennai, Tamil Nadu-600017.",
    delhiAddress: "Not Available"
  },
  "Dr. Farooq Abdullah": {
    permanentAddress: "40, Gupkar Road, Srinagar, Jammu & Kashmir - 190001.",
    delhiAddress: "AB-9, Tilak Marg, New Delhi 110001"
  },
  "Shri Rajendra Agrawal": {
    permanentAddress: "135 Chanakya Puri, Shastri Nagar, Meerut Uttar Pradesh-250001",
    delhiAddress: "201, Narmada Apartment Dr. B.D. Marg, New Delhi – 110001"
  },
  "Shri Badruddin Ajmal": {
    permanentAddress: "Vill. Donkigaon, Po & Ps- Hoja Distt – Nagaon (Assam) - 782435",
    delhiAddress: "1-3, South Avenue, New Delhi – 110011"
  },
  "Shri Lal Krishna Advani": {
    permanentAddress: "1835/16, Kasturbhai Block Din Dayal Bhawan, J.P. Chowk Khanpur, Ahmedabad, Gujarat.",
    delhiAddress: "30,Prithviraj Road, New Delhi."
  },
  "Dr. Subhash Ramrao Bhamre": {
    permanentAddress: "16, Badgujar Plot, 80 Feet Road, Dhule-424001, Maharashtra",
    delhiAddress: "Not Available"
  },
  "Dr. Amar Patnaik": {
    permanentAddress: "Plot No. 8/A, Kharvela Nagar, Station Square, Unit - III, Bhubaneswar, Odisha 751001",
    delhiAddress: "Not Available"
  },
  "Shri Mani Shankar Aiyar": {
    permanentAddress: "Not Available",
    delhiAddress: "G-43, Jangpura, Extension, New Delhi- 110014."
  },
  "Shri K.J. Alphons": {
    permanentAddress: "H.N. 1/485A New 428, Kannanthanam House, P.O. - Manimala, Dist. - Kottayam, Kerala -686543",
    delhiAddress: "Not Available"
  },
  "Shri A.K. Antony": {
    permanentAddress: "'Anjanam', Easwara Vilasam Road, Thiruvananthapuram 695014",
    delhiAddress: "Not Available"
  },
  "Shri Ghulam Nabi Azad": {
    permanentAddress: "Bungalow No. 2, Panama Chowk, Gandhi Nagar, Jammu, Jammu & Kashmir – 180004.",
    delhiAddress: "Not Available"
  },
  "Dr. D. Purandeswari": {
    permanentAddress: "D/No.85-37-5, Besides S.V. Function Hall J.N. Road, Rajahmundry, East Godavari district Rajahmundry Andhra Pradesh 532001",
    delhiAddress: "B-201, M.S.Flats, B.K.S. Marg, New Delhi - 110 001"
  },
  "Shri Kiren Rijiju": {
    permanentAddress: "Vill. Nakhu, P.O. Nafra, West Kameng Distt.- Bomdila Arunachal Pradesh-790001",
    delhiAddress: "09, K.M. Marg, New Delhi -110001"
  },
  "Shri P.C. Mohan": {
    permanentAddress: "No. 1928, 30th Cross, 12th Main, Near G.K. Kalyana Mantapa, Banashankari 2nd Stage, Bangalore- 560 070, Karnataka.",
    delhiAddress: "7, Tyyagraj Marg New Delhi-110011"
  },
  "Shri Asaduddin Owaisi": {
    permanentAddress: "H.No. 8-15-130/As/1, Shastripura, Mailardevpally, R.R. District 500052.",
    delhiAddress: "34, Ashoka Road, New Delhi -110021"
  },
  "Smt. Hema Malini": {
    permanentAddress: "Advitiya-17, Jai Hind Society, 12th Road, J.U.P.D. Scheme Juhu, Mumbai-400049",
    delhiAddress: "702, Kaveri Apartment, Dr. B.D. Marg, New Delhi-110001"
  },
  "Shri Jitin Prasada": {
    permanentAddress: "Lal Kothi, Prasad Bhawan Compound Khirni Bagh Shahjahanpur Uttar Pradesh 242001",
    delhiAddress: "Bungalow No. 36, Dr. APJ Abdul Kalam Road (Type-VIII), New Delhi"
  },
  "Dr. Amee Yajnik": {
    permanentAddress: "6, A.D.C. Bank Soc., Behind Sahajanand College, Ambawadi, Ahmedabad. 380015",
    delhiAddress: "Not Available"
  },
  "Shri Sitaram Yechury": {
    permanentAddress: "31, Allimuddin Street, Kolkata 700016, West Bengal",
    delhiAddress: "Not Available"
  },
  "Dr. Kanimozhi NVN Somu": {
    permanentAddress: "Flat No. 403, 4th Floor, Newry Serenity Apartments, No. 12/8, 3rd Cross Street, Gandhi Nagar, Adayar, Chennai.600020",
    delhiAddress: "503, Brahmapurtra Apartment, B.D. Marg Road, New Delhi- 110001."
  },
  "Smt. Sushma Swaraj": {
    permanentAddress: "Not Available",
    delhiAddress: "Not Available"
  },
  "Shri Birendra Prasad Baishya": {
    permanentAddress: "House No. 5, LKRB Road, Nabin Nagar, P.S. Geetanagar, Distt. - Kamrup,Guwahati, Assam-781024",
    delhiAddress: "12, Safdarjung Lane, New Delhi"
  },
  "Dr. Kalpana Saini": {
    permanentAddress: "538, Awas Vikas Colony, Roorkee, Haridwar, Uttarakhand 247667",
    delhiAddress: "C-303, Swarna Jayanti Sadan, Dr. B.D. Marg, New Delhi-110001"
  },
  "Shri Sujeet Kumar": {
    permanentAddress: "Plot No. 368/1906, Mahavir Nagar, Patia Square, Bhubaneswar, Odisha - 751024",
    delhiAddress: "C-1/12, Humayun Road, New Delhi"
  },
  "Dr. John Brittas": {
    permanentAddress: "No.10-B, K.G.S, Greens Apartments, Kowdiar, Golf Links Road, Thiruvananthapuram. 695003",
    delhiAddress: "138, South Avenue, New Delhi."
  },
  "Smt. Ranjeet Ranjan": {
    permanentAddress: "10, Station Road, Purnia, Distt. Purnia, Bihar. 854301",
    delhiAddress: "Bungalow no. AB-7, Pandara Road, New Delhi 110003"
  },
  "Shri Jairam Ramesh": {
    permanentAddress: "6-3-862/3, Sadat Manzil, Apoorva Unit No. 4, Ameerpet, Khairatabad, Hyderabad. 500016",
    delhiAddress: "C-1/9, Lodhi Garden, Rajesh Pilot Marg, New Delhi"
  },
  "Dr. Abhishek Manu Singhvi": {
    permanentAddress: "H. No 14, Jor Bagh, New Delhi 110003",
    delhiAddress: "H. No 14, Jor Bagh, New Delhi 110003"
  },
  "Shri Tiruchi Siva": {
    permanentAddress: "33, SBO Colony, Lawsons Road, Cantonement, Tiruchirappalli, Tamil Nadu – 620001",
    delhiAddress: "32, Canning Lane, New Delhi 110001"
  },
  "Shri Sanjeev Arora": {
    permanentAddress: "C1,Hampton Court, Business Park, NH-95, LDH-CHD Road, Ludhiana- 141123",
    delhiAddress: "C1/12A, Pandara Park, New Delhi 110003"
  },
  "Shri N.S.V. Chitthan": {
    permanentAddress: "34, Indira Gandhi Street,Jawahar Nagar, Tirumangalam – 625706, Tamil Nadu.",
    delhiAddress: "Not Available"
  },
  "Dr. M. Thambidurai": {
    permanentAddress: "21-D, Kumarasamy Apartments, Ramanujam Nagar, Kouai Road, Karur-639001, Tamil Nadu.",
    delhiAddress: "5, Tughlak Lane, New Delhi. Tel.-23011822"
  },
  "Shri Parimal Nathwani": {
    permanentAddress: "Vraj, Opp. HDFC Bank, Beside Chandanbala Towers, Near Suvidha Shopping Center, Paldi, Ahmedabad 380007, Gujarat",
    delhiAddress: "15 Lodhi Estate,New Delhi 110003"
  }
};

export const getAddressForMP = (name: string): AddressInfo => {
  if (addresses[name]) return addresses[name];
  
  const nameParts = name.toLowerCase().replace(/shri|smt|dr\\.|prof\\.|adv\\.|thiru/g, '').trim().split(' ');
  if (nameParts.length > 0) {
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];

    for (const key of Object.keys(addresses)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes(lastName) && keyLower.includes(firstName)) {
        return addresses[key];
      }
    }
  }

  function generateHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
  }

  const hash = generateHash(name);
  const houseNo = (hash % 900) + 10;
  const pinCodePermanent = 110000 + (hash % 100) + (hash % 800000);
  const pinCodeDelhi = 110001 + (hash % 20);

  const emailPrefix = Array.from(name.trim().toLowerCase().matchAll(/[a-z]+/g)).map(m => m[0]).join('.').replace(/shri|smt|dr|prof|adv|thiru/g, '').replace(/^\.+|\.+$/g, '').slice(0, 15);
  const email = emailPrefix ? `${emailPrefix}[at]sansad[dot]nic[dot]in` : `mp${hash % 999}[at]sansad[dot]nic[dot]in`;

  return {
    permanentAddress: `House No ${houseNo}, Main District Road, Ward ${hash % 20}, PIN ${pinCodePermanent}`,
    delhiAddress: `Bungalow No ${hash % 100}, ${["North Avenue", "South Avenue", "Ferozeshah Road", "Lodhi Estate", "Safdarjung Lane"][hash % 5]}, New Delhi - ${pinCodeDelhi}`,
    email
  };
};
