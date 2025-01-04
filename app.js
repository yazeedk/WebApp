async function fetchTrendData() {
  const aggregation = document.getElementById("aggregation").value;

  if (!aggregation) {
    alert("Please select an aggregation type!");
    return;
  }

  try {
    const response = await fetch(`/api/trend/aggregation=${aggregation}`);
    if (!response.ok) {
      throw new Error("Failed to fetch trend data.");
    }
    const data = await response.json();
    if (data && data.length > 0) {
      const labels = data.map(trend => trend._id);
      const counts = data.map(trend => trend.count);
      updateChart(labels, counts, aggregation);
    } else {
      alert("No trends found for the selected aggregation.");
    }
  } catch (err) {
    console.error("Error fetching trend data:", err);
    alert("Failed to fetch trend data.");
  }
}


function updateChart(labels, data, aggregation) {
  const ctx = document.getElementById("trendChart").getContext("2d");

  if (window.trendChart) {
    window.trendChart.destroy();
  }

  window.trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `Trends (${aggregation})`,
        data: data,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: aggregation === 'hourly' ? 'Hour' : 'Day' }
        },
        y: {
          title: { display: true, text: "Count" }
        }
      }
    }
  });
}
