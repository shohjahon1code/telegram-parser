export interface LocationIQResponse {
  place_id: string
  licence: string
  osm_type: string
  osm_id: string
  lat: string
  lon: string
  display_name: string
  boundingbox: string[]
}

export interface LocationIQAutocompleteResponse {
  place_id: string
  osm_id: string
  osm_type: string
  lat: string
  lon: string
  display_name: string
  display_place: string
  display_address: string
  address: {
    name?: string
    country?: string
    state?: string
    city?: string
    county?: string
    town?: string
    village?: string
  }
  boundingbox: string[]
  class: string
  type: string
}
