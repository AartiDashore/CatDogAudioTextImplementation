const audioSelect = document.getElementById('audioSelect');
const audioPlayer = document.getElementById('audioPlayer');
const predictionText = document.getElementById('predictionText');

function playSound() {
    let selectedFile = document.getElementById("fileDropdown").value;
    let audioPlayer = document.getElementById("audioPlayer");

    audioPlayer.src = "cats_dogs/" + selectedFile;
    audioPlayer.play();

    fetch("/predict_audio/" + selectedFile)
    .then(response => response.json())
    .then(data => {
        document.getElementById("prediction").innerHTML = 
            `🐱 Cat: ${data.cat_probability}% | 🐶 Dog: ${data.dog_probability}% <br> Predicted: ${data.predicted_class}`;
    })
    .catch(error => console.error("Error:", error));
}

function fetchAndRender(file) {
  // Update audio source
  audioPlayer.src = `/audio/${file}`;

  // Waveform
  fetch(`/waveform/${file}`)
    .then(res => res.json())
    .then(data => drawWaveform(data.waveform));

  // Oscillogram
  fetch(`/oscillogram/${file}`)
    .then(res => res.json())
    .then(data => drawOscillogram(data.oscillogram));

  // Spectrogram
  fetch(`/spectrogram/${file}`)
    .then(res => res.json())
    .then(data => drawSpectrogram(data.spectrogram));
}

audioSelect.addEventListener('change', (e) => {
  fetchAndRender(e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
  fetchAndRender(audioSelect.value);
});

document.addEventListener('DOMContentLoaded', () => {
    fetch('/model_accuracy')
        .then(response => response.json())
        .then(data => {
            document.getElementById('accuracyText').textContent = data.accuracy;
        })
        .catch(error => console.error("Error fetching model accuracy:", error));
});


function drawWaveform(data) {
  const svg = d3.select("#waveformChart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width"), height = +svg.attr("height");

  const x = d3.scaleLinear().domain([0, data.length]).range([50, width - 50]);
  const y = d3.scaleLinear().domain([-1, 1]).range([height - 50, 20]); 

  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d));

  const xAxis = d3.axisBottom(x).tickSize(6).tickPadding(10);
  const yAxis = d3.axisLeft(y).tickSize(6).tickPadding(10);

  svg.append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(xAxis)
    .selectAll("text")
    .attr("font-size", "16px")  // Larger font size
    .attr("font-weight", "bold") // Bold text
    .attr("fill", "white");

  svg.append("g")
    .attr("transform", `translate(50, 0)`)
    .call(yAxis)
    .selectAll("text")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", "white");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)  // Move below the x-axis
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .text("Time (samples)");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", 10)  // Move outside the chart
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .attr("transform", "rotate(-90)")
    .text("Amplitude");

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);
}

function drawOscillogram(data) {
  const svg = d3.select("#oscillogramChart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width"), height = +svg.attr("height");

  const x = d3.scaleLinear().domain([0, data.length]).range([50, width - 50]);  
  const y = d3.scaleLinear().domain([0, d3.max(data)]).range([height - 50, 20]);

  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d));

  const xAxis = d3.axisBottom(x).tickSize(6).tickPadding(10);
  const yAxis = d3.axisLeft(y).tickSize(6).tickPadding(10);

  svg.append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(xAxis)
    .selectAll("text")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", "white");

  svg.append("g")
    .attr("transform", `translate(50, 0)`)
    .call(yAxis)
    .selectAll("text")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", "white");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)  
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .text("Time (frames)");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", 10)  
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .attr("transform", "rotate(-90)")
    .text("Energy");

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "orange")
    .attr("stroke-width", 2)
    .attr("d", line);
}

// Inside your fetchAndRender function or in response to an audio selection
function fetchAndRender(file) {
  // Update audio source
  audioPlayer.src = `/audio/${file}`;

  // Fetch prediction
  fetch(`/predict/${file}`)
    .then(res => res.json())
    .then(data => predictionText.textContent = `Prediction: ${data.prediction}`);

  // Fetch and render waveform
  fetch(`/waveform/${file}`)
    .then(res => res.json())
    .then(data => drawWaveform(data.waveform));

  // Fetch and render oscillogram
  fetch(`/oscillogram/${file}`)
    .then(res => res.json())
    .then(data => drawOscillogram(data.oscillogram));

  // Fetch and render spectrogram
  fetchSpectrogram(file);  // Call the function that fetches and renders the spectrogram
}
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRender(audioSelect.value);
});

function fetchSpectrogram(filename) {
    fetch(`/spectrogram/${filename}`)
        .then(response => response.json())
        .then(data => {
            if (data.image) {
                const imgElement = document.getElementById('spectrogramImage');
                imgElement.src = `data:image/png;base64,${data.image}`;
                imgElement.style.display = 'block';
            } else {
                console.error("Failed to fetch spectrogram image.");
            }
        })
        .catch(error => {
            console.error("Error fetching spectrogram:", error);
        });
}



// Function to render the spectrogram using Chart.js
function renderSpectrogram(spectrogram) {
  const ctx = document.getElementById('spectrogramCanvas').getContext('2d'); // Use a single canvas
  const labels = Array.from(Array(spectrogram[0].length).keys()); // Create x-axis labels based on the spectrogram data

  // Generate the heatmap data for Chart.js
  const data = {
    datasets: [{
      label: 'Spectrogram',
      data: [],
      backgroundColor: function (context) {
        const value = context.dataset.data[context.dataIndex];
        // Use a color scale (you can adjust the color scale here)
        return `rgba(0, 0, 255, ${value / 100})`;
      },
      pointRadius: 0,
      pointHitRadius: 5,
      borderColor: 'rgba(0, 0, 255, 0.6)',
      fill: false,
    }]
  };

  // Loop through spectrogram data to convert it into a format that Chart.js can handle
  for (let i = 0; i < spectrogram.length; i++) {
    for (let j = 0; j < spectrogram[i].length; j++) {
      data.datasets[0].data.push({
        x: j,       // Time (x-axis)
        y: i,       // Frequency (y-axis)
        r: spectrogram[i][j] // Intensity (amplitude)
      });
    }
  }

  // Create a new chart instance to render the spectrogram
  new Chart(ctx, {
    type: 'scatter',
    data: data,
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Time" } },
        y: { title: { display: true, text: "Frequency" }, ticks: { stepSize: 10 } }
      }
    }
  });
}
