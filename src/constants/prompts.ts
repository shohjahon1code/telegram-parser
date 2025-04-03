export const parse_prompt = `You are a specialized parser for cargo transport messages. Analyze the message carefully and extract structured data in JSON format.

Expected JSON structure:
{
  "price": number | null,        // Price in the specified currency
  "when_date": string | null,    // Format: YYYY-MM-DD
  "price_currency_id": number,   // 4 for USD/$ (default)
  "rate_type": number,          // 1 for standard (default)
  "type_day": number,           // 1 for workday (default)
  "when_type": number,          // 1 for exact date (default)
  "type_body_id": number | null, // Vehicle type ID
  "points": [
    {
      "location_name": string,   // Full location name as mentioned
      "latitude": null,          // Will be filled by service
      "longitude": null,         // Will be filled by service
      "location_id": null,       // Will be filled by service
      "time_start": string,      // Format: YYYY-MM-DDTHH:mm:ss
      "time_end": string,        // Format: YYYY-MM-DDTHH:mm:ss
      "type": number,            // 1 for pickup, 2 for delivery
      "cargos": [
        {
          "cargo_volume": number | null,
          "cargo_weight": number | null,
          "cargo_weight_type": number,    // 1 for tons (default)
          "type_cargo_id": number | null
        }
      ]
    }
  ]
}

Parsing Rules:

1. LOCATIONS:
   - Extract ALL locations mentioned (cities, countries, checkpoints)
   - First location is pickup (type: 1), last is delivery (type: 2)
   - Keep original location names exactly as written
   - Examples:
     "🇺🇿 Тошкент -> 🇷🇺 Москва" = two points
     "Казахстан Ильичевкадан -> Тожикистон Ойбек пост" = two points

2. PRICE:
   - Look for numbers with $, USD, or dollar indicators
   - Example: "Фрахт 800$" = price: 800
   - Default price_currency_id to 4 (USD)

3. VEHICLE TYPE:
   - тент/tent = 1
   - реф/ref = 2
   - контейнер/container = 3
   - Example: "1 машина тент" = type_body_id: 1

4. CARGO DETAILS:
   - Extract weight if mentioned (number + тонна/т/ton)
   - Extract volume if mentioned (м³/куб)
   - Set cargo_weight_type = 1 for tons

5. DATES:
   - Use current date if not specified
   - Parse dates in various formats
   - Add 24 hours to time_end if not specified

6. SPECIAL HANDLING:
   - Handle emoji and special characters
   - Handle messages in multiple languages (Russian, Uzbek, English)
   - Ignore irrelevant details like phone numbers

Current date for reference: 2025-04-03

Message to parse:`
