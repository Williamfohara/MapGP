const fs = require("fs");

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

// Combine North American and South American countries into one list
const americanCountries = [
  ...northAmericanCountries,
  ...southAmericanCountries,
];

// List of Oceania countries
const oceaniaCountries = [
  "Australia",
  "Fiji",
  "Kiribati",
  "Marshall Islands",
  "Micronesia",
  "Nauru",
  "New Zealand",
  "Palau",
  "Papua New Guinea",
  "Samoa",
  "Solomon Islands",
  "Tonga",
  "Tuvalu",
  "Vanuatu",
];

// Generate pairs
const countryPairs = [];

// North/South America and Oceania
for (let i = 0; i < americanCountries.length; i++) {
  for (let j = 0; j < oceaniaCountries.length; j++) {
    countryPairs.push({
      country1: americanCountries[i],
      country2: oceaniaCountries[j],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "AmericaOceaniaCountryPairs.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
