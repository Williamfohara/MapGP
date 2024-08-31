const fs = require("fs");

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

// Europe and Oceania
for (let i = 0; i < europeanCountries.length; i++) {
  for (let j = 0; j < oceaniaCountries.length; j++) {
    countryPairs.push({
      country1: europeanCountries[i],
      country2: oceaniaCountries[j],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "EuropeOceaniaCountryPairs.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
