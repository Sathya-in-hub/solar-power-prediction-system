const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(lat, lon) {
    try {
      if (!this.apiKey) {
        return this.getMockWeatherData(lat, lon);
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return {
        success: true,
        data: {
          temperature: response.data.main.temp,
          feelsLike: response.data.main.feels_like,
          humidity: response.data.main.humidity,
          pressure: response.data.main.pressure,
          cloudCover: response.data.clouds.all,
          windSpeed: response.data.wind.speed,
          windDirection: response.data.wind.deg,
          weather: response.data.weather[0].main,
          description: response.data.weather[0].description,
          icon: response.data.weather[0].icon,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return this.getMockWeatherData(lat, lon);
    }
  }

  async getForecast(lat, lon, days = 7) {
    try {
      if (!this.apiKey) {
        return this.getMockForecast(lat, lon, days);
      }

      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (3-hour intervals)
        }
      });

      // Process forecast data
      const dailyForecast = this.processForecastData(response.data.list);
      
      return {
        success: true,
        data: dailyForecast
      };
    } catch (error) {
      console.error('Forecast API error:', error.message);
      return this.getMockForecast(lat, lon, days);
    }
  }

  async getSolarRadiation(lat, lon, date) {
    // This would integrate with a solar radiation API
    // For now, return calculated value based on weather and location
    try {
      const weather = await this.getCurrentWeather(lat, lon);
      const baseRadiation = this.calculateBaseRadiation(lat, lon, date);
      
      // Adjust for cloud cover
      const cloudFactor = 1 - (weather.data.cloudCover / 100) * 0.7;
      const adjustedRadiation = baseRadiation * cloudFactor;
      
      return {
        success: true,
        data: {
          ghi: adjustedRadiation, // Global Horizontal Irradiance
          dni: adjustedRadiation * 1.2, // Direct Normal Irradiance
          dhi: adjustedRadiation * 0.3, // Diffuse Horizontal Irradiance
          unit: 'kWh/m²/day',
          cloudAdjusted: true
        }
      };
    } catch (error) {
      console.error('Solar radiation calculation error:', error);
      return {
        success: false,
        data: this.calculateBaseRadiation(lat, lon, date)
      };
    }
  }

  // Helper methods
  calculateBaseRadiation(lat, lon, date) {
    // Simplified solar radiation model
    const dayOfYear = this.getDayOfYear(date);
    const latitudeRad = lat * Math.PI / 180;
    
    // Solar declination angle
    const declination = 23.45 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365);
    const declinationRad = declination * Math.PI / 180;
    
    // Sunset hour angle
    const cosH = -Math.tan(latitudeRad) * Math.tan(declinationRad);
    const sunsetHour = Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI / 15;
    
    // Extraterrestrial radiation
    const solarConstant = 1.367; // kW/m²
    const distanceCorrection = 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
    
    // Clear sky radiation (simplified)
    const clearSkyRadiation = solarConstant * distanceCorrection * 
      (Math.sin(latitudeRad) * Math.sin(declinationRad) * sunsetHour * 15 * Math.PI / 180 +
       Math.cos(latitudeRad) * Math.cos(declinationRad) * Math.sin(sunsetHour * 15 * Math.PI / 180)) /
      (sunsetHour * 15 * Math.PI / 180);
    
    // Adjust for atmospheric effects
    const atmosphericTransmission = 0.7; // 70% transmission
    const groundRadiation = clearSkyRadiation * atmosphericTransmission;
    
    return parseFloat(groundRadiation.toFixed(2));
  }

  getDayOfYear(date) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  processForecastData(forecastList) {
    const daily = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!daily[date]) {
        daily[date] = {
          date,
          temperatures: [],
          cloudCovers: [],
          humidities: [],
          weather: []
        };
      }
      
      daily[date].temperatures.push(item.main.temp);
      daily[date].cloudCovers.push(item.clouds.all);
      daily[date].humidities.push(item.main.humidity);
      daily[date].weather.push(item.weather[0].main);
    });
    
    // Calculate daily averages
    return Object.values(daily).map(day => ({
      date: day.date,
      avgTemperature: this.average(day.temperatures).toFixed(1),
      minTemperature: Math.min(...day.temperatures).toFixed(1),
      maxTemperature: Math.max(...day.temperatures).toFixed(1),
      avgCloudCover: this.average(day.cloudCovers).toFixed(0),
      avgHumidity: this.average(day.humidities).toFixed(0),
      dominantWeather: this.mode(day.weather)
    }));
  }

  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  mode(arr) {
    const freq = {};
    arr.forEach(item => freq[item] = (freq[item] || 0) + 1);
    return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
  }

  getMockWeatherData(lat, lon) {
    // Generate realistic mock data based on location
    const isCoastal = Math.abs(lon - 72) < 5; // Rough coastal approximation
    
    return {
      success: true,
      data: {
        temperature: 25 + Math.random() * 10,
        feelsLike: 27 + Math.random() * 8,
        humidity: isCoastal ? 70 + Math.random() * 20 : 40 + Math.random() * 30,
        pressure: 1010 + Math.random() * 10,
        cloudCover: Math.random() * 60,
        windSpeed: 5 + Math.random() * 15,
        windDirection: Math.random() * 360,
        weather: ['Clear', 'Clouds', 'Haze'][Math.floor(Math.random() * 3)],
        description: 'Simulated weather data',
        icon: '01d',
        timestamp: new Date(),
        isMock: true
      }
    };
  }

  getMockForecast(lat, lon, days) {
    const forecast = [];
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        avgTemperature: (25 + Math.random() * 8).toFixed(1),
        minTemperature: (20 + Math.random() * 5).toFixed(1),
        maxTemperature: (30 + Math.random() * 8).toFixed(1),
        avgCloudCover: Math.floor(Math.random() * 60),
        avgHumidity: Math.floor(40 + Math.random() * 40),
        dominantWeather: ['Clear', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)]
      });
    }
    
    return {
      success: true,
      data: forecast,
      isMock: true
    };
  }
}

module.exports = new WeatherService();