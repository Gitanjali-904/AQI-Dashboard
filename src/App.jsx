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

function App() {

  const [data, setData] = useState({
    pm25: 0,
    no2: 0,
    o3: 0,
    aqi: 0,
    category: "Loading",
    temperature: 0,
    humidity: 0,
    predictedAQI: 0
  });

  const [history, setHistory] = useState([]);

  // ==========================================
  // THINGSPEAK SETTINGS
  // ==========================================

  const CHANNEL_ID = "3500352";

  const API_URL =
    `https://api.thingspeak.com/channels/${3500352}/feeds.json?results=20`;

  // ==========================================
  // GET DATA FROM THINGSPEAK
  // ==========================================

  const fetchData = async () => {

    try {

      const response = await fetch(API_URL);

      const result = await response.json();

      if (!result.feeds || result.feeds.length === 0) {
        return;
      }

      const feeds = result.feeds;

      const latest = feeds[feeds.length - 1];

      const pm25 = Number(latest.field1) || 0;
      const no2 = Number(latest.field2) || 0;
      const o3 = Number(latest.field3) || 0;
      const aqi = Number(latest.field4) || 0;
      const categoryCode = Number(latest.field5) || 0;
      const temperature = Number(latest.field6) || 0;
      const humidity = Number(latest.field7) || 0;
      const predictedAQI = Number(latest.field8) || 0;

      setData({
        pm25,
        no2,
        o3,
        aqi,
        category: getCategory(categoryCode),
        temperature,
        humidity,
        predictedAQI
      });

      const chartData = feeds.map((item) => ({
        time: new Date(item.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),

        aqi: Number(item.field4) || 0,

        predicted:
          Number(item.field8) || 0
      }));

      setHistory(chartData);

    } catch (error) {

      console.error(
        "ThingSpeak error:",
        error
      );

    }

  };


  // ==========================================
  // AQI CATEGORY
  // ==========================================

  const getCategory = (code) => {

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

  };


  // ==========================================
  // AQI COLOR
  // ==========================================

  const getAQIClass = (aqi) => {

    if (aqi <= 50)
      return "good";

    if (aqi <= 100)
      return "satisfactory";

    if (aqi <= 200)
      return "moderate";

    if (aqi <= 300)
      return "poor";

    if (aqi <= 400)
      return "very-poor";

    return "severe";

  };


  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {

    fetchData();

    const interval =
      setInterval(fetchData, 20000);

    return () =>
      clearInterval(interval);

  }, []);


  return (

    <div className="dashboard">

      {/* HEADER */}

      <header className="header">

        <div>

          <h1>
            Air Quality Monitoring
          </h1>

          <p>
            Real-Time IoT Air Pollution Detection
            & Prediction
          </p>

        </div>

        <div className="status">

          <span className="status-dot"></span>

          System Online

        </div>

      </header>


      {/* AQI MAIN CARD */}

      <section className="aqi-section">

        <div
          className={`aqi-card ${getAQIClass(
            data.aqi
          )}`}
        >

          <p className="aqi-label">
            CURRENT AQI
          </p>

          <h2>
            {Math.round(data.aqi)}
          </h2>

          <p className="aqi-category">
            {data.category}
          </p>

          <p className="aqi-standard">
            CPCB Air Quality Index
          </p>

        </div>

      </section>


      {/* SENSOR CARDS */}

      <section className="sensor-grid">

        <div className="sensor-card">

          <div className="sensor-icon">
            PM
          </div>

          <div>

            <p>PM2.5</p>

            <h3>
              {data.pm25.toFixed(1)}
              <span> µg/m³</span>
            </h3>

          </div>

        </div>


        <div className="sensor-card">

          <div className="sensor-icon">
            NO₂
          </div>

          <div>

            <p>Nitrogen Dioxide</p>

            <h3>
              {data.no2.toFixed(1)}
              <span> ppb</span>
            </h3>

          </div>

        </div>


        <div className="sensor-card">

          <div className="sensor-icon">
            O₃
          </div>

          <div>

            <p>Ozone</p>

            <h3>
              {data.o3.toFixed(1)}
              <span> ppb</span>
            </h3>

          </div>

        </div>


        <div className="sensor-card">

          <div className="sensor-icon">
            °C
          </div>

          <div>

            <p>Temperature</p>

            <h3>
              {data.temperature.toFixed(1)}
              <span> °C</span>
            </h3>

          </div>

        </div>


        <div className="sensor-card">

          <div className="sensor-icon">
            %
          </div>

          <div>

            <p>Humidity</p>

            <h3>
              {data.humidity.toFixed(1)}
              <span> %</span>
            </h3>

          </div>

        </div>

      </section>


      {/* AQI GRAPH */}

      <section className="chart-card">

        <div className="section-title">

          <div>

            <h2>
              AQI History
            </h2>

            <p>
              Real-time air quality trend
            </p>

          </div>

        </div>


        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <LineChart data={history}>

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="time"
            />

            <YAxis
              domain={[0, 500]}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="aqi"
              strokeWidth={3}
              dot={false}
              name="AQI"
            />

          </LineChart>

        </ResponsiveContainer>

      </section>


      {/* PREDICTION */}

      <section className="prediction-card">

        <div>

          <p>
            MACHINE LEARNING PREDICTION
          </p>

          <h2>
            {Math.round(data.predictedAQI)}
          </h2>

          <span>
            Predicted AQI
          </span>

        </div>

        <div className="prediction-info">

          <h3>
            Future Air Quality
          </h3>

          <p>
            Prediction generated using
            historical air-quality data.
          </p>

        </div>

      </section>


      {/* FOOTER */}

      <footer>

        <p>
          Real-Time Air Pollution Detection &
          Prediction using IoT and ML
        </p>

        <p>
          ESP32 • ThingSpeak • Machine Learning
        </p>

      </footer>

    </div>

  );

}

export default App;