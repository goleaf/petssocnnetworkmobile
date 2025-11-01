import { db } from "../lib/db"

const synonyms = [
  { term: "gsd", synonyms: ["german shepherd", "german shepherd dog", "alsatian"] },
  { term: "german shepherd", synonyms: ["gsd", "german shepherd dog", "alsatian"] },
  { term: "lab", synonyms: ["labrador", "labrador retriever"] },
  { term: "labrador", synonyms: ["lab", "labrador retriever"] },
  { term: "poodle", synonyms: ["pood", "poodle dog"] },
  { term: "golden retriever", synonyms: ["golden", "goldie"] },
  { term: "beagle", synonyms: ["beag", "beagle dog"] },
  { term: "french bulldog", synonyms: ["frenchie", "french bulldog"] },
  { term: "persian", synonyms: ["persian cat", "longhair"] },
  { term: "siamese", synonyms: ["siamese cat"] },
  { term: "bengal", synonyms: ["bengal cat", "bengal tiger cat"] },
  { term: "maine coon", synonyms: ["maine coon cat", "coon cat"] },
  { term: "training", synonyms: ["train", "teaching", "obedience"] },
  { term: "health", synonyms: ["wellness", "medical", "care"] },
  { term: "nutrition", synonyms: ["food", "diet", "feeding"] },
]

async function seedSynonyms() {
  console.log("Seeding synonyms...")
  
  for (const { term, synonyms: syns } of synonyms) {
    try {
      await db.synonym.upsert({
        where: { term: term.toLowerCase() },
        update: { synonyms: syns.map((s) => s.toLowerCase()) },
        create: {
          term: term.toLowerCase(),
          synonyms: syns.map((s) => s.toLowerCase()),
        },
      })
      console.log(`✓ Seeded: ${term}`)
    } catch (error) {
      console.error(`✗ Failed to seed ${term}:`, error)
    }
  }
  
  console.log("Done seeding synonyms!")
  await db.$disconnect()
}

seedSynonyms()

