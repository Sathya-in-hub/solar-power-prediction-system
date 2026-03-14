# nasa_power.py
import requests
from datetime import datetime, timedelta

def get_solar_data(lat, lon, date_str):
    """
    Get real solar data from NASA POWER API for any lat/lon
    No API key needed - completely free
    """
    try:
        # NASA needs dates in YYYYMMDD format
        date = datetime.strptime(date_str, '%Y-%m-%d')
        start = date.strftime('%Y%m%d')
        end = date.strftime('%Y%m%d')

        url = 'https://power.larc.nasa.gov/api/temporal/daily/point'
        params = {
            'parameters': 'ALLSKY_SFC_SW_DWN,T2M,RH2M,CLOUD_AMT',
            'community': 'RE',
            'longitude': lon,
            'latitude': lat,
            'start': start,
            'end': end,
            'format': 'JSON'
        }

        response = requests.get(url, params=params, timeout=15)
        data = response.json()

        props = data['properties']['parameter']
        date_key = start

        solar = props['ALLSKY_SFC_SW_DWN'][date_key]
        temp  = props['T2M'][date_key]
        humid = props['RH2M'][date_key]
        cloud = props['CLOUD_AMT'][date_key]

        # NASA returns -999 for missing data
        if solar == -999:
            return None

        return {
            'source': 'nasa-power',
            'solar_irradiance': round(solar, 2),
            'temperature': round(temp, 1),
            'humidity': round(humid, 1),
            'cloud_cover': round(cloud, 1)
        }

    except Exception as e:
        print(f'NASA POWER error: {e}')
        return None


def get_monthly_averages(lat, lon):
    """
    Get 12-month solar averages for a location
    Uses last full year of data
    """
    try:
        url = 'https://power.larc.nasa.gov/api/temporal/monthly/point'
        params = {
            'parameters': 'ALLSKY_SFC_SW_DWN',
            'community': 'RE',
            'longitude': lon,
            'latitude': lat,
            'start': '2023',
            'end': '2023',
            'format': 'JSON'
        }

        response = requests.get(url, params=params, timeout=15)
        data = response.json()

        monthly = data['properties']['parameter']['ALLSKY_SFC_SW_DWN']
        months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec']

        result = []
        for i, month_name in enumerate(months, 1):
            key = f'202301' if i == 1 else f'2023{str(i).zfill(2)}'
            value = monthly.get(key, 0)
            result.append({
                'month': month_name,
                'avg_solar': round(value, 2) if value != -999 else 0
            })

        annual_avg = sum(m['avg_solar'] for m in result) / 12

        return {
            'monthly': result,
            'annual_average': round(annual_avg, 2),
            'best_month': max(result, key=lambda x: x['avg_solar'])['month'],
            'worst_month': min(result, key=lambda x: x['avg_solar'])['month']
        }

    except Exception as e:
        print(f'NASA monthly error: {e}')
        return None