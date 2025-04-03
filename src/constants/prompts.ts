export const prompt = `Parse the following cargo transport message and extract the following information in JSON format:
      - price
      - when_date (in YYYY-MM-DD format)
      - price_currency_id (4 for USD)
      - rate_type (1 for standard)
      - type_day (1 for workday)
      - when_type (1 for exact date)
      - type_body_id (vehicle type)
      - points (array of pickup and delivery points with coordinates)
        - each point should have: latitude, longitude, location_id, time_start, time_end, type (1 for pickup, 2 for delivery)
        - for pickup point include cargos array with: cargo_volume, cargo_weight, cargo_weight_type (1 for tons), type_cargo_id

      Message to parse:`