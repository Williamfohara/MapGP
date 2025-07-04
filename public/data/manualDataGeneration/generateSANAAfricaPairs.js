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

// List of African countries
const africanCountries = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Democratic Republic of the Congo",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Ivory Coast",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "Sao Tome and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
];

// Generate pairs
const countryPairs = [];

// South America and Africa
for (let i = 0; i < southAmericanCountries.length; i++) {
  for (let j = 0; j < africanCountries.length; j++) {
    countryPairs.push({
      country1: southAmericanCountries[i],
      country2: africanCountries[j],
    });
    countryPairs.push({
      country1: africanCountries[j],
      country2: southAmericanCountries[i],
    });
  }
}

// North America and Africa
for (let i = 0; i < northAmericanCountries.length; i++) {
  for (let j = 0; j < africanCountries.length; j++) {
    countryPairs.push({
      country1: northAmericanCountries[i],
      country2: africanCountries[j],
    });
    countryPairs.push({
      country1: africanCountries[j],
      country2: northAmericanCountries[i],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "SouthAmericaAfricaNorthAmericaAfrica.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
