// services/nasaPowerService.js
const axios = require('axios');

class NASAPowerService {
  constructor() {
    this.baseURL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
  }

  async getSolarData(lat, lon, startDate, endDate) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          parameters: 'ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,T2M,RH2M,CLOUD_AMT',
          community: 'RE',
          longitude: lon,
          latitude: lat,
          start: startDate.replace(/-/g, ''),  // NASA needs YYYYMMDD
          end: endDate.replace(/-/g, ''),
          format: 'JSON'
        },
        timeout: 15000
      });

      const props = response.data.properties.parameter;
      const dates = Object.keys(props.ALLSKY_SFC_SW_DWN);

      return {
        success: true,
        source: 'nasa-power',
        data: dates.map(date => ({
          date: `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,
          solarIrradiance: props.ALLSKY_SFC_SW_DWN[date],  // kWh/m²/day
          clearSkySolar: props.CLRSKY_SFC_SW_DWN[date],
          temperature: props.T2M[date],
          humidity: props.RH2M[date],
          cloudCover: props.CLOUD_AMT[date]
        }))
      };
    } catch (error) {
      console.error('NASA POWER error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getMonthlyAverage(lat, lon, year = 2023) {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const data = await this.getSolarData(lat, lon, start, end);

    if (!data.success) return data;

    // Group by month and average
    const monthly = {};
    data.data.forEach(d => {
      const month = d.date.slice(0, 7);
      if (!monthly[month]) monthly[month] = [];
      monthly[month].push(d.solarIrradiance);
    });

    return {
      success: true,
      monthly: Object.entries(monthly).map(([month, vals]) => ({
        month,
        avgIrradiance: (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2)
      }))
    };
  }
}

module.exports = new NASAPowerService();