"""Small Open-Meteo client used for live weather queries."""
import json
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional


WEATHER_CODES = {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
}


class WeatherService:
    """Fetches a current forecast without storing a user's location."""

    def _fetch_json(self, url: str) -> Dict[str, Any]:
        request = urllib.request.Request(url, headers={"User-Agent": "SIH-Research-Agent/1.0"})
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    def _resolve_location(self, location: str) -> Optional[Dict[str, Any]]:
        params = urllib.parse.urlencode({"name": location, "count": 1, "language": "en", "format": "json"})
        result = self._fetch_json(f"https://geocoding-api.open-meteo.com/v1/search?{params}")
        places = result.get("results") or []
        return places[0] if places else None

    def get_current_weather(
        self, location: Optional[str] = None, latitude: Optional[float] = None, longitude: Optional[float] = None
    ) -> Dict[str, Any]:
        if latitude is None or longitude is None:
            if not location or not location.strip():
                return {"needs_location": True}
            place = self._resolve_location(location.strip())
            if not place:
                return {"needs_location": True, "location_not_found": True}
            latitude = float(place["latitude"])
            longitude = float(place["longitude"])
            label = ", ".join(part for part in [place.get("name"), place.get("admin1"), place.get("country")] if part)
        else:
            label = "Your current location"

        params = urllib.parse.urlencode({
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "timezone": "auto",
        })
        forecast = self._fetch_json(f"https://api.open-meteo.com/v1/forecast?{params}")
        current = forecast.get("current") or {}
        code = current.get("weather_code")
        return {
            "needs_location": False,
            "location": label,
            "observed_at": current.get("time"),
            "condition": WEATHER_CODES.get(code, "Current conditions unavailable"),
            "temperature_c": current.get("temperature_2m"),
            "feels_like_c": current.get("apparent_temperature"),
            "humidity_percent": current.get("relative_humidity_2m"),
            "wind_kmh": current.get("wind_speed_10m"),
            "precipitation_mm": current.get("precipitation"),
        }


weather_service = WeatherService()
