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

// Generate pairs
const countryPairs = [];
for (let i = 0; i < europeanCountries.length; i++) {
  for (let j = i + 1; j < europeanCountries.length; j++) {
    countryPairs.push({
      country1: europeanCountries[i],
      country2: europeanCountries[j],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "EuropeNoFlip.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
