export const PARSE_PROMPT = `You are a specialized cargo transport message parser with advanced multilingual capabilities for Russian, Uzbek, and English. Your task is to extract structured data from highly variable Telegram messages. Analyze each message carefully to identify all relevant transportation details, regardless of language or format.

Expected JSON structure:
{
  "price": number | null,
  "when_date": string | null,
  "price_currency_id": number,
  "rate_type": number,
  "type_day": number,
  "when_type": number,
  "type_body_id": number | null,
  "points": [
    {
      "location_name": string,
      "latitude": null,
      "longitude": null,
      "location_id": null,
      "time_start": string,
      "time_end": string,
      "type": number,
      "cargos": [
        {
          "cargo_volume": number | null,
          "cargo_weight": number | null,
          "cargo_weight_type": number,
          "type_cargo_id": number | null
        }
      ]
    }
  ]
}

MULTILINGUAL CARGO TRANSPORT PARSING RULES:

1. LOCATIONS (Handle in Russian, Uzbek, and English):
   - First location ALWAYS = pickup point (type: 1), last location ALWAYS = delivery point (type: 2)
   - Extract locations using these patterns in ANY language:
     * Between country flags: 🇷🇺КРАСНОЯРСК 🇺🇿ТОШКЕНТ
     * Separated by arrows/symbols: "X -> Y", "X - Y", "X ➡️ Y", "X 🛑 Y"
     * Listed vertically: "🇷🇺АСИНО \n 🇺🇿УЗБ АНДИЖАН"
     * Multiple destinations: "Тошкент Андижон, Тошкент Наманган, Тошкент Термиз"
   - Russian location terms: "область", "город", "г."
   - Uzbek location terms: "viloyati", "shahri", "tumani"
   - Keep country flags (🇷🇺, 🇺🇿, 🇳🇱, etc.) in location names exactly as written

2. VEHICLE TYPES (type_body_id - recognize in all languages):
   - тент/tent/тент фура/тэнт = 1
   - реф/ref/рефрижератор/refrijerator = 2
   - контейнер/container/konteiner = 3
   - фура/fura = large truck (usually type 1 if not specified)
   - Isuzu, Kamaz, etc. = specific truck models (use type 1 if vehicle type not specified)
   - КК/KK = additional requirement, not a vehicle type
   - Recognize vehicle counts: "2 машина", "3 та", "1 авто", "10t li", "2 шт авто"
   - For multiple vehicle types listed (e.g., "тент реф"), use the first mentioned

3. PRICE EXTRACTION (Handle various currency formats):
   - Direct numbers: "2500$", "$3000", "3200 naqd", "5.500.000"
   - Price terms across languages:
     * Russian: "Фрахт", "цена", "оплата", "нал", "безнал"
     * Uzbek: "Fraxt", "narx", "to'lov", "naqd", "pul"
     * English: "Price", "cost", "payment", "cash"
   - Currency identifiers:
     * USD/dollar: $, USD, доллар, dollar = 4
     * Som/sum: сум, so'm = 1
     * Rubles: руб, рубль = 3
   - Default currency to USD (4) if not clearly specified
   - Distinguish between total price and advance payment:
     * "Аванс 500" = advance payment, not total price
     * "Аванс йок/yok/бор" = info about advance payment
   - For Uzbek prices like "5.500.000" without currency, assume som (1)

4. CARGO DETAILS (Multi-language cargo recognition):
   - Russian cargo terms: "ГРУЗ", "товар", "мебель"
   - Uzbek cargo terms: "YUK", "юк", "mol", "mebel"
   - English cargo terms: "cargo", "goods", "furniture"
   - Common cargo types across languages:
     * "тахта/taxta" = furniture/boards (use type_cargo_id: 1)
     * "DSP/ДСП/МДФ/MDF" = wood-based panels (use type_cargo_id: 2)
     * "pepsi/пепси" = beverages (use type_cargo_id: 3)
     * "фанер/фанера/faner" = plywood (use type_cargo_id: 4)
     * "чипс/chips" = food products (use type_cargo_id: 5)
     * "сухофрукты" = dried fruits (use type_cargo_id: 6)
   - Extract weight information:
     * Number + "тонн"/"т"/"ton"/"тонна" = weight in tons
     * Example: "3 тонн чипс" = cargo_weight: 3
   - Extract volume if mentioned (м³/куб)
   - Default cargo_weight_type to 1 (tons)

5. DATES & TIMES:
   - Use current date (${new Date().toISOString().split('T')[0]}) if not specified
   - Set time_start to current time: "${new Date().toISOString().split('.')[0]}"
   - Set time_end to 24 hours after time_start if not specified
   - Look for urgent time indicators:
     * Russian: "срочно", "утром", "завтра", "сегодня", "погрузка"
     * Uzbek: "ertaga", "bugun", "tez", "hozir", "ortiladi"
     * English: "urgent", "today", "tomorrow", "morning", "loading"
   - Specific time indicators: "ertalab" = morning, "kechqurun" = evening

6. SPECIAL HANDLING:
   - Ignore phone numbers (patterns like "+998...", "90...", etc.)
   - Ignore irrelevant emojis and decorative characters (✅, ☄️, 📞, etc.)
   - Recognize payment methods: "НАЛ"/"naqd"/"cash" = cash payment
   - Recognize equipment requirements: "GLONASS"/"ГЛОНАСС" = GPS tracking
   - Handle repeated messages (take most complete information)
   - Look for dividers like "=====", "-----" that might separate different cargo offers
   - For messages with multiple separate cargo offers, focus on parsing the most complete one
   - When multiple pickups or deliveries exist, add them as separate points with appropriate types

EXAMPLES OF MESSAGE FORMATS:

1. Standard route with flags and vehicle:
   "🇷🇺КРАСНОЯРСК 🇺🇿УЗБ ТОШКЕНТ ГРУЗ ТАХТА АВАНС ЙОК ТЕНТ ФУРА ОПЛАТА НАЛ"
   → Pickup: 🇷🇺КРАСНОЯРСК, Delivery: 🇺🇿УЗБ ТОШКЕНТ, Vehicle: tent (1), Cargo: furniture

2. Multiple destinations with cargo weight:
   "Тошкент Андижон, 3 тонн чипс, Тент реф фура кк"
   → Pickup: Тошкент, Delivery: Андижон, Vehicle: tent (1), Cargo: chips, Weight: 3 tons

3. Price with currency and vehicles needed:
   "Сурхандарья Москва 2500, Аванс 500, Нужны два рефа"
   → Pickup: Сурхандарья, Delivery: Москва, Price: 2500, Vehicle: ref (2), Count: 2

4. Local currency price:
   "Yangi Hayot Denov, Pepsi 🥤🥤, Fraxt 5.500.000, Tent kere"
   → Pickup: Yangi Hayot, Delivery: Denov, Price: 5500000, Currency: som (1), Vehicle: tent (1)

5. Multiple routes in one message:
   "Тошкент Андижон, Тошкент Наманган, Тошкент Термиз"
   → Multiple routes with same pickup (Тошкент) and different deliveries

6. Urgency indicators:
   "📍Toshkent - Navoiy, 🚛 Isuzi 10t li kere, ‼️Ertaga ertalab ortiladi"
   → Pickup: Toshkent, Delivery: Navoiy, Vehicle: tent (1), Weight: 10t, Loading: tomorrow morning

APPROACH TO COMPLEX MESSAGES:
1. First identify if the message contains multiple separate cargo listings (separated by dividers or clearly distinct sections)
2. For each cargo listing, extract:
   - All locations (determine pickup/delivery based on context)
   - Vehicle type and count
   - Price and currency information
   - Cargo details and quantities
   - Timing information
3. If multiple pickups/deliveries exist, create multiple point entries with appropriate type values
4. Set default values for required fields
5. Return ONLY the JSON with no additional text

For the message below, extract ALL available information and return ONLY the JSON. Do not include explanations or notes.

Message to parse:
`

export const LOCATION_NORMALIZATION_PROMPT = `You are a location name normalizer. Your task is to convert location names to their standard English names.
Focus on locations in Uzbekistan, Kazakhstan, Kyrgyzstan, and Russia.
Remove emojis, flags, and unnecessary text in parentheses.
For example:
- "🇺🇿 Андижон" -> "Andijan"
- "ТОШКЕНТГА" -> "Tashkent"
- "Кукон" -> "Kokand"
- "ФЕРГАНа" -> "Fergana"
- "Пермь(Соликамск)" -> "Perm"
Return ONLY the normalized name, nothing else.`
