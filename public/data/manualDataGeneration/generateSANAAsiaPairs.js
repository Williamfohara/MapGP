const fs = require("fs");

// List of South American countries
const southAmericanCountries = [
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Ecuador",
  "Guyana",
  "Paraguay",
  "Peru",
  "Suriname",
  "Uruguay",
  "Venezuela",
];

// List of North American countries
const northAmericanCountries = [
  "Antigua and Barbuda",
  "Bahamas",
  "Barbados",
  "Belize",
  "Canada",
  "Costa Rica",
  "Cuba",
  "Dominica",
  "Dominican Republic",
  "El Salvador",
  "Grenada",
  "Guatemala",
  "Haiti",
  "Honduras",
  "Jamaica",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Trinidad and Tobago",
  "United States",
];

// List of Asian countries
const asianCountries = [
  "Afghanistan",
  "Armenia",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Bhutan",
  "Brunei",
  "Cambodia",
  "China",
  "Georgia",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Israel",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Lebanon",
  "Malaysia",
  "Maldives",
  "Mongolia",
  "Myanmar",
  "Nepal",
  "North Korea",
  "Oman",
  "Pakistan",
  "Palestine",
  "Philippines",
  "Qatar",
  "Saudi Arabia",
  "Singapore",
  "South Korea",
  "Sri Lanka",
  "Syria",
  "Tajikistan",
  "Thailand",
  "Timor-Leste",
  "Turkey",
  "Turkmenistan",
  "United Arab Emirates",
  "Uzbekistan",
  "Vietnam",
  "Yemen",
];

// Generate pairs
const countryPairs = [];

// South America and Asia
for (let i = 0; i < southAmericanCountries.length; i++) {
  for (let j = 0; j < asianCountries.length; j++) {
    countryPairs.push({
      country1: southAmericanCountries[i],
      country2: asianCountries[j],
    });
  }
}

// North America and Asia
for (let i = 0; i < northAmericanCountries.length; i++) {
  for (let j = 0; j < asianCountries.length; j++) {
    countryPairs.push({
      country1: northAmericanCountries[i],
      country2: asianCountries[j],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "SouthAmericaAsiaNorthAmericaAsia.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
