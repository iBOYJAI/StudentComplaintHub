// Simple chart component for displaying data visualizations
// In production, you might use Chart.js or similar library

export class Chart {
  static renderBarChart(data, options = {}) {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return `
      <div class="chart-container">
        <div class="chart-title">${options.title || ''}</div>
        <div class="bar-chart">
          ${data.map(item => {
            const percentage = (item.value / maxValue) * 100;
            return `
              <div class="bar-item">
                <div class="bar-label">${item.label}</div>
                <div class="bar-wrapper">
                  <div class="bar-fill" style="width: ${percentage}%; background-color: ${item.color || 'var(--color-primary)'}">
                    <span class="bar-value">${item.value}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  static renderPieChart(data, options = {}) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return `
      <div class="chart-container">
        <div class="chart-title">${options.title || ''}</div>
        <div class="pie-chart-legend">
          ${data.map(item => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return `
              <div class="legend-item">
                <span class="legend-color" style="background-color: ${item.color}"></span>
                <span class="legend-label">${item.label}</span>
                <span class="legend-value">${percentage}% (${item.value})</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  static renderLineChart(data, options = {}) {
    return `
      <div class="chart-container">
        <div class="chart-title">${options.title || ''}</div>
        <div class="chart-placeholder">
          <p>Line Chart: ${data.length} data points</p>
          <p class="text-sm text-muted">Chart visualization placeholder</p>
        </div>
      </div>
    `;
  }
}

// Add these styles inline since we're in a simple setup
const chartStyles = `
<style>
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.bar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.bar-label {
  min-width: 100px;
  font-size: var(--font-size-sm);
}

.bar-wrapper {
  flex: 1;
  height: 32px;
  background-color: var(--color-gray-100);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--spacing-2);
  transition: width var(--transition-base);
}

.bar-value {
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.pie-chart-legend {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-sm);
}

.legend-label {
  flex: 1;
  font-size: var(--font-size-sm);
}

.legend-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
</style>
`;
