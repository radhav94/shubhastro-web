/**
 * PieChart Component - Usage Examples
 * 
 * A reusable pie chart component built with Chart.js
 * Can be used anywhere in the application for data visualization
 */

import React from 'react';
import PieChart from './PieChart';

// Example 1: Basic Usage
const BasicExample = () => {
  const data = [
    { label: 'Red', value: 30, color: '#ef4444' },
    { label: 'Blue', value: 25, color: '#3b82f6' },
    { label: 'Green', value: 20, color: '#10b981' },
    { label: 'Yellow', value: 15, color: '#f59e0b' },
    { label: 'Purple', value: 10, color: '#8b5cf6' }
  ];

  return (
    <PieChart 
      data={data}
      title="Color Distribution"
    />
  );
};

// Example 2: Without Legend
const NoLegendExample = () => {
  const data = [
    { label: 'Category A', value: 40, color: '#f97316' },
    { label: 'Category B', value: 35, color: '#06b6d4' },
    { label: 'Category C', value: 25, color: '#84cc16' }
  ];

  return (
    <PieChart 
      data={data}
      title="Categories"
      showLegend={false}
    />
  );
};

// Example 3: Custom Height and Legend Position
const CustomExample = () => {
  const data = [
    { label: 'Fire', value: 35, color: '#dc2626' },
    { label: 'Water', value: 30, color: '#2563eb' },
    { label: 'Earth', value: 20, color: '#65a30d' },
    { label: 'Air', value: 15, color: '#0891b2' }
  ];

  return (
    <PieChart 
      data={data}
      title="Elemental Distribution"
      showLegend={true}
      legendPosition="right"
      height={400}
      className="my-custom-class"
    />
  );
};

// Example 4: Dynamic Data from API
const DynamicExample = ({ apiData }) => {
  // Transform API data to chart format
  const chartData = apiData?.map(item => ({
    label: item.name,
    value: item.percentage,
    color: item.hexColor
  })) || [];

  return (
    <PieChart 
      data={chartData}
      title="API Data Visualization"
    />
  );
};

// Example 5: Aura Colors (Real Use Case)
const AuraColorsExample = ({ auraColors }) => {
  const chartData = Object.entries(auraColors || {})
    .filter(([_, value]) => value && value.percentage)
    .map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: value.percentage,
      color: value.color?.toLowerCase() || '#ccc'
    }));

  return (
    <PieChart 
      data={chartData}
      title="Aura Color Distribution"
      showLegend={true}
      legendPosition="bottom"
      height={350}
    />
  );
};

/**
 * Props Documentation:
 * 
 * @param {Array} data - Required. Array of objects with structure:
 *   - label: string (required) - Label for the segment
 *   - value: number (required) - Numeric value (percentage or count)
 *   - color: string (optional) - Hex color code (defaults to #ccc)
 * 
 * @param {string} title - Optional. Chart title displayed above the chart
 * 
 * @param {boolean} showLegend - Optional. Show/hide legend (default: true)
 * 
 * @param {string} legendPosition - Optional. Legend position: 'top', 'bottom', 'left', 'right' (default: 'bottom')
 * 
 * @param {number} height - Optional. Maximum height in pixels (default: 350)
 * 
 * @param {string} className - Optional. Additional CSS class for custom styling
 */

export {
  BasicExample,
  NoLegendExample,
  CustomExample,
  DynamicExample,
  AuraColorsExample
};
