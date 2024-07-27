// This script is used to add all of the timelines that had errors when being loaded

const { MongoClient, ObjectId } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

// Load failed relationships from JSON file
const failedRelationships = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../data/failedRelationships.json"),
    "utf-8"
  )
);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

function formatTimeline(timeline) {
  // Convert markdown-like headers to <strong> tags
  timeline = timeline.replace(
    /(#+)\s*(.*?)\n/g,
    function (match, hashes, text) {
      return "<strong>" + text.trim() + "</strong><br>";
    }
  );

  // Remove any remaining '#' characters from the text
  timeline = timeline.replace(/#/g, "");

  // Convert **bold** to <strong> and *italic* to <em>
  timeline = timeline.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  timeline = timeline.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Normalize line breaks: convert any mix of <br> with \n to just <br>
  timeline = timeline.replace(/<br>\s*\n|\n\s*<br>/g, "<br>");
  timeline = timeline.replace(/\n/g, "<br>");

  return timeline;
}

function parseTimelineToJSON(timeline, country1, country2) {
  const lines = timeline.split("<br>");
  const jsonTimeline = lines
    .map((line) => {
      const yearMatch = line.match(/^(\d{4})/);
      if (yearMatch) {
        const year = yearMatch[1];
        const text = line.replace(/^(\d{4})\s*/, "").trim();
        return { year, text, country1, country2 };
      }
      return null;
    })
    .filter((entry) => entry !== null);
  return jsonTimeline;
}

async function generateRelationshipTimeline(
  country1,
  country2,
  retries = 3,
  delay = 1000
) {
  const prompt = `You are a historian of international geopolitics. Create a detailed timeline with excruciating granularity (in regards to the decision of whether or not to add a timeline event) explaining the geopolitical relationship between ${country1} and ${country2} from when they first recognized each other, up to the year 2000. Ensure each entry provides rich context, including key figures, political contexts, specific actions, and consequences. Avoid generalizations and instead include concrete events, treaties, wars, diplomatic missions, and significant political and economic changes. Each entry should begin with the year, followed by a concise but detailed description. Do not use bullet points. Here are some examples:

1821 Mexico gains independence from Spain.
1822 Joel Robert Poinsett embarks on a special mission to Mexico, publishing an account of his experiences in 'Notes on Mexico.'

1823 The United States recognizes Mexico as an independent nation.
1823 United States president James Monroe articulates the Monroe Doctrine in his seventh annual message to Congress.

1824 Joel Robert Poinsett is appointed first U.S. minister to Mexico.

1825 Over several years, empresario Stephen F. Austin attracts the first 300 American families into the Coahuilas y Tejas territory.

1826 American empresario Haden Edwards leads Fredonian Rebellion in an attempt to secede from Mexico.

1829 Mexico abolishes slavery.

1830 Mexican-owned Tejas is home to roughly 20,000 Americans.
1830 Mexico prohibits immigration to Tejas from the United States in an effort to stop the influx of English-speaking settlers.

1835 American immigrants and Tejanos lead the Texas Revolution on behalf of the Tejas province of Mexico as part of a larger Mexican Federalist's War.

1836 The Battle of the Alamo.
1836 An independent Republic of Texas is declared during the Texas Convention.
1836 Santa Anna surrenders after defeat in Battle of San Jacinto; Treaties of Valasco unofficially marks Rio Grande as the border between Mexico and the Republic of Texas.

1838 Mexico defends itself successfully from French invasion during the 'Pastry War'; Santa Anna's role helps him regain popularity.

1841 Santa Anna returns to the Mexican presidency, ordering the military to pressure the Mexican-Texas border.

1842 San Antonio is taken and returned several times; a back-and-forth of Mexican militants and Tejanos crossing the border for raids and returning to Mexico continues.

1845 Expansionist Democrat James K. Polk becomes U.S. President.
1845 Mexico refuses to negotiate the acceptance of Texas' annexation into the United States.
1845 Republic of Texas annexed into the United States as the 28th state.

1846 President James K. Polk orders General Zachary Taylor to occupy disputed territory between the Nueces and Rio Grande rivers.
1846 Mexican troops at Matamoros cross the Rio Grande and ambush an American patrol, which President Polk declares an act of war.
1846 Mexican-American War begins.

1847 The United States army marches towards Mexico City from the north while the United States navy takes Veracruz via amphibious assault.
1847 The United States army takes and occupies Mexico City.

1848 The Treaty of Guadalupe Hidalgo is signed, ending the Mexican-American War.

1854 Gadsden Purchase is finalized and signed, forming the current day borders between the United States and Mexico.

1861-1867 Invoking the Monroe Doctrine, the United States provides diplomatic and material support to Mexico during the French Intervention in Mexico.

1870s-1890s Mexico encourages repatriation of Mexican-Americans back into its northern territories.

1876 Porfirio Díaz seizes power in Mexico with the financial support of U.S. entrepreneurs from South Texas.

1884-1990s The Porfiriato government strengthens U.S.-Mexico economic ties through mining and railroad investments.

1910-1917 Discontent with the Porfiriato leads to Mexican Revolution, U.S. involvement and interventions strain relations.

1913 'Pact of the Embassy' brokered by US ambassador Henry Lane Wilson to Mexico, leading to Francisco Madero's assassination and Victoriano Huerta's ascension to Mexican presidency.
1913 Woodrow Wilson elected President of the United States and embargoes weapons and supplies to Huerta's Mexican Federalist troops.

1914 President Wilson sends US marines to occupy Mexico's port of Veracruz, heightening tensions between the two countries.

1916 President Wilson orders the Pancho Villa Expedition, which ultimately fails.
1916 President Wilson and Venustiano Carranza agree to a Joint High Commission, leading to the withdrawal of US troops from Mexican territory.

1917 Venustiano Carranza elected president of Mexico.
1917 Zimmermann telegram is intercepted by the British and sent to the United States, swaying public opinion in favor of joining the World War.

1923 Bucareli Agreement of 1923.

1933 'Good Neighbor Policy' implemented by US President Franklin Delano Roosevelt.

1934-1940 Lázaro Cárdenas expropriates and redistributes more than six million acres of U.S.-owned property in Mexico during his presidency.
1938 Cárdenas nationalizes Mexico's petroleum sector.
1938 Roosevelt pushes US owners of oil companies to end their boycott of Mexican crude oil and accept adequate compensation for repossessed properties.

1939 Mexico stops trading with Germany.

1940 Mexico stops trading with Italy and Japan.

1941 Mexican President Manuel Ávila Camacho severs relations with Japan, Germany, and Italy after the attack on Pearl Harbor.

1942 Mexico declares war on the Axis powers.
1942 Bracero Program starts, allowing Mexican agricultural workers to work temporarily in the US.

1945 Mexican expeditionary fighter squadron “Aztec Eagles” gives aid to US efforts in the Philippines.
1941-1945 250,000 Mexicans and a million Mexican Americans serve in the U.S. armed forces during WW2.

1947-1948 Some 300,000 U.S. tourists visit Mexico annually.

1961 Mexican leaders praise the Cuban Revolution and refuse to sever diplomatic ties with Castro's government, despite pressure from the US President John F Kennedy.

1964 Bracero program ends.

1965 The U.S. introduces the Immigration and Nationality Act, changing how immigration quotas are managed.

1968 United States backs the Institutional Revolutionary Party during the Tlatelolco Massacre.

1969 US President Richard Nixon launches Operation Intercept, causing US customs officials to begin searching each and every border-crossing vehicle for drugs.

1973 Drug Enforcement Administration is established in the US to coordinate drug enforcement efforts.

1975 Mexican government begins Operation Condor in an effort to eradicate and interdict drugs.

1980 Guadalajara cartel, one of the first major Mexican drug cartels, is formed.

1982 Mexico signs agreement with the International Monetary Fund to reschedule debt payments, opening foreign trade and investment.

1983 US leaders grudgingly accept Mexican support for Nicaragua's Sandinista government and lead efforts to find peaceful resolutions to conflicts in the region.

1985 DEA agent Enrique 'Kiki' Camarena is kidnapped, tortured, and murdered by the Guadalajara Cartel, leading to increased U.S.-Mexico cooperation on drug enforcement.

1989 The US begins the certification process, evaluating countries' efforts in combating drug trafficking. Non-cooperative countries risk losing US aid and trade benefits.

1986 Immigration and Reform Control Act allocates new resources to the Border Patrol, sanctions US employers who hire illegal workers, and offers amnesty legalization to long-term undocumented residents and agricultural workers.

1994 North American Free Trade Agreement, or NAFTA, deepens US and Mexican economic ties.
1994 California adopts Proposition 187, denying undocumented residents access to nearly all public services, including schools and hospitals.

1996 Congress passes the Illegal Immigration Reform and Immigrant Responsibility Act of 1996.
1996 Mexico passes the 1996 Constitutional Amendment on Dual Nationality.

1997 General Jesús Gutiérrez Rebollo, Mexico's top anti-drug official, is arrested for protecting a cartel leader, highlighting corruption issues.

2000 Marking the end of 71 years of Institutional Revolutionary Party rule, Vicente Fox is elected President of Mexico, promising to combat drug cartels.

Continue in this detailed manner up to the year 2000. Do not acknowledge me.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 10500,
        temperature: 0.75,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 200000, // Increased timeout to 10 seconds
      }
    );

    const relationshipTimeline =
      response.data.choices[0].message.content.trim();
    return formatTimeline(relationshipTimeline);
  } catch (error) {
    if (
      (error.code === "ETIMEDOUT" ||
        error.code === "ENOTFOUND" ||
        error.response?.status === 429) &&
      retries > 0
    ) {
      console.error(
        `Error generating relationship timeline for ${country1} and ${country2}:`,
        error.message
      );
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, delay)); // Wait before retrying
      return generateRelationshipTimeline(
        country1,
        country2,
        retries - 1,
        delay * 2
      ); // Increase delay for subsequent retries
    } else {
      console.error(
        `Failed to generate timeline for ${country1} and ${country2}:`,
        error.message
      );
      return null;
    }
  }
}

async function saveTimelineToFile(dirIndex, country1, country2, timeline) {
  const dirPath = path.resolve(
    __dirname,
    `../../data/timelines/batch_${dirIndex}`
  );
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const filename = `${country1}_${country2}_timeline.json`;
  const filePath = path.resolve(dirPath, filename);
  fs.writeFileSync(filePath, JSON.stringify(timeline, null, 2), "utf-8");
  console.log(`Saved timeline to ${filePath}`);
}

async function populateDatabase() {
  const db = client.db("testingData1");
  const collection = db.collection("timelineData");
  let dirIndex = 1;
  let fileCount = 0;

  for (const relationship of failedRelationships) {
    const relationshipTimeline = await generateRelationshipTimeline(
      relationship.country1,
      relationship.country2
    );

    if (relationshipTimeline) {
      const jsonTimeline = parseTimelineToJSON(
        relationshipTimeline,
        relationship.country1,
        relationship.country2
      );
      for (const event of jsonTimeline) {
        const result = await collection.insertOne({
          country1: relationship.country1,
          country2: relationship.country2,
          year: event.year,
          text: event.text,
        });
        // Add the _id from the MongoDB assigned ObjectId
        event._id = result.insertedId;
      }
      console.log(
        `Inserted relationship timeline for: ${relationship.country1} and ${relationship.country2}`
      );

      await saveTimelineToFile(
        dirIndex,
        relationship.country1,
        relationship.country2,
        jsonTimeline
      );

      fileCount++;
      if (fileCount >= 20) {
        fileCount = 0;
        dirIndex++;
      }
    } else {
      console.log(
        `Failed to generate timeline for: ${relationship.country1} and ${relationship.country2}`
      );
    }
  }

  console.log("Database populated with initial relationship timelines");
}

async function main() {
  try {
    await connectToMongoDB();
    await populateDatabase();
  } catch (error) {
    console.error("Error during script execution:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

main();
