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

// List of European countries
const europeanCountries = [
  "Albania",
  "Andorra",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Kazakhstan",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "United Kingdom",
  "Vatican City",
];

// Generate pairs
const countryPairs = [];

// South America and Europe
for (let i = 0; i < southAmericanCountries.length; i++) {
  for (let j = 0; j < europeanCountries.length; j++) {
    countryPairs.push({
      country1: southAmericanCountries[i],
      country2: europeanCountries[j],
    });
  }
}

// North America and Europe
for (let i = 0; i < northAmericanCountries.length; i++) {
  for (let j = 0; j < europeanCountries.length; j++) {
    countryPairs.push({
      country1: northAmericanCountries[i],
      country2: europeanCountries[j],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "SouthAmericaEuropeNorthAmericaEurope.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
