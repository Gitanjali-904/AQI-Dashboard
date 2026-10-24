import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import "./App.css";

const API_URL =
  "https://api.thingspeak.com/channels/3500352/feeds.json?results=20";

function getCategory(code) {
  switch (code) {
    case 1:
      return "Good";
    case 2:
      return "Satisfactory";
    case 3:
      return "Moderate";
    case 4:
      return "Poor";
    case 5:
      return "Very Poor";
    case 6:
      return "Severe";
    default:
      return "Unknown";
  }
}

function getAQIClass(aqi) {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "satisfactory";
  if (aqi <= 200) return "moderate";
  if (aqi <= 300) return "poor";
  if (aqi <= 400) return "very-poor";
  return "severe";
}

function App() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Connecting");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let cancelled = false;
    let activeController = null;

    async function fetchData() {
      // Skip this refresh if the previous request is still running.
      if (activeController) return;

      const controller = new AbortController();
      activeController = controller;

      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(API_URL, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(
            `ThingSpeak request failed (${response.status}). Check channel access.`
          );
        }

        const result = await response.json();

        if (!Array.isArray(result.feeds) || result.feeds.length === 0) {
          throw new Error(
            "No readings returned. Check the Channel ID and channel access."
          );
        }

        const feeds = result.feeds;
        const latest = feeds[feeds.length - 1];

        // Preserve missing readings instead of displaying them as zero.
        const toNumber = (value) => {
          if (value === null || value === undefined || value === "") {
            return null;
          }

          const number = Number(value);
          return Number.isFinite(number) ? number : null;
        };

        const nextData = {
          pm25: toNumber(latest.field1),
          no2: toNumber(latest.field2),
          o3: toNumber(latest.field3),
          aqi: toNumber(latest.field4),
          category: getCategory(toNumber(latest.field5)),
          temperature: toNumber(latest.field6),
          humidity: toNumber(latest.field7),
          predictedAQI: toNumber(latest.field8)
        };

        const chartData = feeds.map((item) => ({
          time: new Date(item.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }),
          aqi: toNumber(item.field4),
          predicted: toNumber(item.field8)
        }));

        if (cancelled) return;

        setData(nextData);
        setHistory(chartData);
        setLastUpdated(new Date(latest.created_at).toLocaleString());
        setStatus("Connected");
        setError("");
      } catch (err) {
        if (cancelled) return;

        console.error("ThingSpeak error:", err);
        setStatus("Connection error");
        setError(
          err.name === "AbortError"
            ? "ThingSpeak took too long to respond. Retrying automatically."
            : err.message || "Unable to load ThingSpeak data."
        );
      } finally {
        clearTimeout(timeout);

        if (activeController === controller) {
          activeController = null;
        }
      }
    }

    fetchData();

    const interval = setInterval(fetchData, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      activeController?.abort();
    };
  }, []);

  function formatValue(value, decimals = 1) {
    return value === null || value === undefined
      ? "—"
      : value.toFixed(decimals);
  }

  const aqiClass =
    data?.aqi === null || data?.aqi === undefined
      ? ""
      : getAQIClass(data.aqi);

  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Air Quality Monitoring</h1>
          <p>Real-Time IoT Air Pollution Detection & Prediction</p>
        </div>

        <div className="status" role="status">
          <span
            className="status-dot"
            style={{
              backgroundColor:
                status === "Connected"
                  ? "#22c55e"
                  : status === "Connecting"
                    ? "#f59e0b"
                    : "#ef4444"
            }}
          />
          {status}
        </div>
      </header>

      {/* CONNECTION INFORMATION */}
      {error && (
        <p role="alert" style={{ color: "#dc2626" }}>
          {error}
          {data && " Displaying the last successfully loaded readings."}
        </p>
      )}

      {lastUpdated && (
        <p className="last-updated">
          Latest ThingSpeak reading: {lastUpdated}
        </p>
      )}

      {/* AQI MAIN CARD */}
      <section className="aqi-section">
        <div className={`aqi-card ${aqiClass}`}>
          <p className="aqi-label">CURRENT AQI</p>

          <h2>{formatValue(data?.aqi, 0)}</h2>

          <p className="aqi-category">
            {data ? data.category : error ? "Unavailable" : "Loading"}
          </p>

          <p className="aqi-standard">CPCB Air Quality Index</p>
        </div>
      </section>

      {/* SENSOR CARDS */}
      <section className="sensor-grid">
        <div className="sensor-card">
          <div className="sensor-icon">PM</div>
          <div>
            <p>PM2.5</p>
            <h3>
              {formatValue(data?.pm25)}
              <span> µg/m³</span>
            </h3>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-icon">NO₂</div>
          <div>
            <p>Nitrogen Dioxide</p>
            <h3>
              {formatValue(data?.no2)}
              <span> ppb</span>
            </h3>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-icon">O₃</div>
          <div>
            <p>Ozone</p>
            <h3>
              {formatValue(data?.o3)}
              <span> ppb</span>
            </h3>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-icon">°C</div>
          <div>
            <p>Temperature</p>
            <h3>
              {formatValue(data?.temperature)}
              <span> °C</span>
            </h3>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-icon">%</div>
          <div>
            <p>Humidity</p>
            <h3>
              {formatValue(data?.humidity)}
              <span> %</span>
            </h3>
          </div>
        </div>
      </section>

      {/* AQI GRAPH */}
      <section className="chart-card">
        <div className="section-title">
          <div>
            <h2>AQI History</h2>
            <p>Real-time air quality trend</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, "auto"]} />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="aqi"
              stroke="#6366f1"
              strokeWidth={3}
              dot={false}
              name="AQI"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* PREDICTION */}
      <section className="prediction-card">
        <div>
          <p>MACHINE LEARNING PREDICTION</p>
          <h2>{formatValue(data?.predictedAQI, 0)}</h2>
          <span>Predicted AQI</span>
        </div>

        <div className="prediction-info">
          <h3>Future Air Quality</h3>
          <p>
            Displays the predicted AQI uploaded to ThingSpeak field 8.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <p>
          Real-Time Air Pollution Detection & Prediction using IoT and ML
        </p>
        <p>ESP32 • ThingSpeak • Machine Learning</p>
      </footer>
    </div>
  );
}

export default App;