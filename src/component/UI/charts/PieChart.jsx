import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';
import styles from './PieChart.module.scss';

const PieChart = ({ 
  data, 
  title, 
  showLegend = true, 
  legendPosition = 'bottom',
  height = 350,
  className = ''
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data && data.length > 0) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.map(item => item.label),
          datasets: [{
            data: data.map(item => item.value),
            backgroundColor: data.map(item => item.color || '#ccc'),
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: showLegend,
              position: legendPosition,
              labels: {
                padding: 15,
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                },
                color: '#4b5563',
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              padding: 16,
              cornerRadius: 8,
              titleFont: {
                size: 15,
                weight: '600',
                family: "'Inter', sans-serif"
              },
              bodyFont: {
                size: 14,
                family: "'Inter', sans-serif"
              },
              titleColor: '#fff',
              bodyColor: '#fff',
              displayColors: true,
              boxWidth: 12,
              boxHeight: 12,
              boxPadding: 6,
              callbacks: {
                title: function(context) {
                  // Show the color name as title
                  return context[0].label;
                },
                label: function(context) {
                  // Show the percentage
                  return `${context.parsed}%`;
                },
                labelColor: function(context) {
                  // Show the actual color in the tooltip
                  return {
                    borderColor: context.dataset.backgroundColor[context.dataIndex],
                    backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                    borderWidth: 2,
                    borderRadius: 2
                  };
                }
              }
            }
          }
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, showLegend, legendPosition]);

  if (!data || data.length === 0) {
    return (
      <div className={`${styles.chartContainer} ${className}`}>
        {title && <h3 className={styles.chartTitle}>{title}</h3>}
        <div className={styles.noData}>No data available</div>
      </div>
    );
  }

  return (
    <div className={`${styles.chartContainer} ${className}`}>
      {title && <h3 className={styles.chartTitle}>{title}</h3>}
      <div className={styles.chartWrapper}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

PieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string
    })
  ).isRequired,
  title: PropTypes.string,
  showLegend: PropTypes.bool,
  legendPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  height: PropTypes.number,
  className: PropTypes.string
};

export default PieChart;
