import React, { useEffect, useRef } from 'react';
import { getRegionalData } from '../services/api';

const Heatmap = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawHeatmap();
  }, []);

  const drawHeatmap = async () => {
    const data = await getRegionalData();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Draw India map outline (simplified)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 800, 600);

    // Draw heatmap overlay with color coding based on solar potential
    data.regions.forEach(region => {
      const color = getColorForIntensity(region.intensity);
      ctx.fillStyle = color;
      
      // Simplified region drawing (in production, use GeoJSON paths)
      ctx.beginPath();
      // Draw region polygon...
      ctx.fill();
    });

    // Add legend
    drawLegend(ctx);
  };

  const getColorForIntensity = (intensity) => {
    if (intensity > 6) return 'rgba(255, 0, 0, 0.7)';     // Excellent - Red
    if (intensity > 5) return 'rgba(255, 165, 0, 0.7)';  // Good - Orange
    if (intensity > 4) return 'rgba(255, 255, 0, 0.7)';  // Moderate - Yellow
    if (intensity > 3) return 'rgba(144, 238, 144, 0.7)'; // Low - Light Green
    return 'rgba(0, 128, 0, 0.7)';                        // Poor - Dark Green
  };

  const drawLegend = (ctx) => {
    const legendX = 620;
    const legendY = 50;
    const colors = [
      { color: 'rgba(255, 0, 0, 0.7)', label: '>6 kWh/m²' },
      { color: 'rgba(255, 165, 0, 0.7)', label: '5-6 kWh/m²' },
      { color: 'rgba(255, 255, 0, 0.7)', label: '4-5 kWh/m²' },
      { color: 'rgba(144, 238, 144, 0.7)', label: '3-4 kWh/m²' },
      { color: 'rgba(0, 128, 0, 0.7)', label: '<3 kWh/m²' }
    ];

    ctx.font = '12px Arial';
    colors.forEach((item, index) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY + index * 30, 20, 20);
      ctx.fillStyle = '#000';
      ctx.fillText(item.label, legendX + 30, legendY + index * 30 + 15);
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">India Solar Potential Heatmap</h2>
      <div className="card">
        <div className="card-body">
          <canvas 
            ref={canvasRef} 
            width="800" 
            height="600" 
            style={{ width: '100%', height: 'auto', border: '1px solid #ccc' }}
          />
          <p className="mt-3 text-muted">
            Color intensity indicates solar power potential (kWh/m²/day)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;