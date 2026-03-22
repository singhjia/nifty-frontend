import { useState, useEffect } from "react";
import "./App.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = "https://hellajia-mynifty-dashboard.hf.space";

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartPeriod, setChartPeriod] = useState("1mo");
  const [accuracyData, setAccuracyData] = useState([]);

  const fetchData = async () => {
    try {
      const [analysisRes, accuracyRes] = await Promise.all([
        fetch(`${API_URL}/api/analysis`),
        fetch(`${API_URL}/api/accuracy`),
      ]);
      const json     = await analysisRes.json();
      const accJson  = await accuracyRes.json();
      setData(json);
      setAccuracyData(accJson.accuracy || []);
      setError(null);
    } catch (err) {
      setError("Unable to connect to analysis server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
    }
  }, [darkMode]);

  const readDashboard = () => {
    const text = document.body.innerText;
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  };

  const directionColor = (label) => {
    if (!label) return "";
    const l = label.toLowerCase();
    if (l === "bullish" || l === "positive") return "green";
    if (l === "bearish" || l === "negative") return "red";
    return "neutral-color";
  };

  const signalWidth = (value) => {
    return `${Math.round((value + 1) / 2 * 100)}%`;
  };

  if (loading) return (
    <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "18px", marginBottom: "8px" }}>⏳ Loading analysis...</p>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Fetching live market data and running sentiment analysis</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "18px", marginBottom: "8px", color: "#ef4444" }}>⚠️ {error}</p>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Make sure the backend server is running on port 8000</p>
        <button onClick={fetchData} className="icon-btn" style={{ marginTop: "16px", padding: "10px 20px" }}>
          Retry
        </button>
      </div>
    </div>
  );

  const { prediction, stocks, news, last_updated } = data;

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div>
          <h1>NIFTY 50 Sentiment Dashboard</h1>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
            AI-powered market outlook using financial news sentiment and technical analysis
          </p>
        </div>
        <div className="header-controls">
          <span className="last-updated">Last Updated: {last_updated}</span>
          <button onClick={readDashboard} className="icon-btn">🔊</button>
          <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
            {darkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      {/* ── Market Outlook ── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <h2>Today's Market Outlook</h2>
        <div style={{ display: "flex", gap: "40px", alignItems: "flex-start", flexWrap: "wrap", marginTop: "16px" }}>

          {/* Direction + Confidence + Reasoning */}
          <div>
            <div className="sentiment-row">
              <span
                className="badge"
                style={{
                  background: prediction.direction === "Bullish" ? "#16a34a" :
                               prediction.direction === "Bearish" ? "#dc2626" : "#d97706"
                }}
              >
                {prediction.direction}
              </span>
              <span className="confidence">{prediction.confidence}% confidence</span>
            </div>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>Top Reasons:</p>
              {prediction.reasoning.map((r, i) => (
                <p key={i} style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "4px" }}>· {r}</p>
              ))}
            </div>
          </div>

          {/* Signal Summary */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "10px" }}>
              Signal Breakdown
              <span
                title="Each signal is scored from -1 (strongly bearish) to +1 (strongly bullish). Signals are weighted: Technical 40%, Sentiment 30%, Structure 20%, Volume 10%."
                style={{ marginLeft: "6px", cursor: "help", opacity: 0.6 }}
              >
                ⓘ
              </span>
            </p>
            {Object.entries(prediction.signal_summary).map(([key, signal]) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ textTransform: "capitalize" }}>{key}</span>
                  <span className={directionColor(signal.label)}>{signal.label} ({signal.value})</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress ${signal.value >= 0 ? "green-bar" : "red-bar"}`}
                    style={{ width: signalWidth(signal.value) }}
                  />
                </div>
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{signal.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid">

      {/* NIFTY 50 Panel */}
<div className="card left-panel">

  {/* Index Header */}
  <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>NIFTY 50</p>
  <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
    <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>
      {data.nifty.price?.toLocaleString("en-IN")}
    </h1>
    <span className={data.nifty.change >= 0 ? "green" : "red"} style={{ fontSize: "16px" }}>
      {data.nifty.change >= 0 ? "↗" : "↘"} {data.nifty.change >= 0 ? "+" : ""}{data.nifty.change} ({data.nifty.change >= 0 ? "+" : ""}{data.nifty.change_pct}%)
    </span>
  </div>

  {/* Open High Low */}
  <div style={{ display: "flex", gap: "20px", marginTop: "8px", fontSize: "13px" }}>
    <span style={{ color: "#9ca3af" }}>Open: <span style={{ color: "#e5e7eb" }}>{data.nifty.open?.toLocaleString("en-IN")}</span></span>
    <span style={{ color: "#9ca3af" }}>High: <span className="green">{data.nifty.high?.toLocaleString("en-IN")}</span></span>
    <span style={{ color: "#9ca3af" }}>Low: <span className="red">{data.nifty.low?.toLocaleString("en-IN")}</span></span>
  </div>

  {/* Period Selector */}
  <div style={{ display: "flex", gap: "8px", margin: "16px 0 8px 0" }}>
    {["1d", "5d", "1mo", "3mo"].map((p) => (
      <button
        key={p}
        onClick={() => setChartPeriod(p)}
        style={{
          padding: "4px 14px",
          borderRadius: "6px",
          border: "1px solid",
          borderColor: chartPeriod === p ? "#3b82f6" : "#374151",
          background: chartPeriod === p ? "#1d4ed8" : "transparent",
          color: chartPeriod === p ? "#fff" : "#9ca3af",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: chartPeriod === p ? "bold" : "normal",
        }}
      >
        {p.toUpperCase()}
      </button>
    ))}
  </div>

  {/* Chart */}
  {data.chart && data.chart[chartPeriod] ? (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data.chart[chartPeriod]}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
      >
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          interval="preserveStartEnd"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          width={65}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v.toLocaleString("en-IN")}
        />
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "NIFTY 50"]}
          labelStyle={{ color: "#9ca3af" }}
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke={data.nifty.change >= 0 ? "#10b981" : "#ef4444"}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <div className="chart-box">Loading chart...</div>
  )}

  {/* Scores below chart */}
  <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "12px", color: "#6b7280", flexWrap: "wrap" }}>
    <span>Composite: <span style={{ color: prediction.composite_score >= 0 ? "#10b981" : "#ef4444" }}>{prediction.composite_score}</span></span>
    <span>Technical: <span style={{ color: prediction.technical_signal >= 0 ? "#10b981" : "#ef4444" }}>{prediction.technical_signal}</span></span>
    <span>Sentiment: <span style={{ color: prediction.sentiment_signal >= 0 ? "#10b981" : "#ef4444" }}>{prediction.sentiment_signal}</span></span>
  </div>

</div>  

        {/* Top 5 Stocks */}
        <div className="card stocks">
          <h2>Top 5 Weighted Constituents</h2>
          {stocks.map((stock, index) => (
            <div className="stock-card" key={index}>
              <div className="stock-top">
                <span className="stock-name">{stock.name}</span>
                <div className="stock-right">
                  <span className="stock-price">₹{stock.price.toLocaleString()}</span>
                  <span className={stock.change_pct >= 0 ? "green" : "red"}>
                    {stock.change_pct >= 0 ? "▲" : "▼"} {Math.abs(stock.change_pct)}%
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress ${stock.change_pct >= 0 ? "green-bar" : "red-bar"}`}
                  style={{ width: `${stock.weight}%` }}
                />
              </div>
              <div className="stock-bottom">
                <span>Weight: {stock.weight}%</span>
                <span className={directionColor(stock.sentiment)}>{stock.sentiment}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
      {/* ── Comparative Analysis Chart ── */}
<div className="card" style={{ marginTop: "20px" }}>
  <h2>Prediction vs Actual — Comparative Analysis</h2>
  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px" }}>
    Compares full model composite score, technical-only score, and actual NIFTY daily % change (normalised to -1 to +1 scale). Updated end of each trading day.
  </p>

  {accuracyData.length > 0 ? (
    <>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={accuracyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value, name) => [value.toFixed(4), name]}
          />
          {/* Zero line for reference */}
          <Line
            type="monotone"
            dataKey={() => 0}
            stroke="#374151"
            strokeWidth={1}
            dot={false}
            strokeDasharray="4 4"
            name="Zero"
          />
          {/* Full model */}
          <Line
            type="monotone"
            dataKey="composite_score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Full Model"
          />
          {/* Technical only */}
          <Line
            type="monotone"
            dataKey="technical_score"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Technical Only"
          />
          {/* NIFTY Technical Only */}
          <Line
            type="monotone"
            dataKey="nifty_technical"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="NIFTY Technical"
          />
          {/* Actual NIFTY move */}
          <Line
            type="monotone"
            dataKey="actual_normalised"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Actual NIFTY"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "12px", flexWrap: "wrap" }}>
        <span><span style={{ color: "#3b82f6" }}>●</span> Full Model (Composite)</span>
        <span><span style={{ color: "#f59e0b" }}>●</span> Technical Only</span>
        <span><span style={{ color: "#a855f7" }}>●</span> NIFTY Technical Only</span>
        <span><span style={{ color: "#10b981" }}>●</span> Actual NIFTY Move</span>
      </div>

      {/* Accuracy summary */}
      <div style={{ marginTop: "16px", padding: "12px", background: "#1f2937", borderRadius: "8px", fontSize: "13px" }}>
        <span style={{ color: "#9ca3af" }}>Days logged: </span>
        <span style={{ color: "#e5e7eb" }}>{accuracyData.length}</span>
        <span style={{ color: "#9ca3af", marginLeft: "20px" }}>Correct predictions: </span>
        <span style={{ color: "#10b981" }}>
          {accuracyData.filter(d => d.correct).length}/{accuracyData.length}
          {accuracyData.length > 0 && ` (${Math.round(accuracyData.filter(d => d.correct).length / accuracyData.length * 100)}%)`}
        </span>
      </div>
    </>
  ) : (
    <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", background: "#1f2937", borderRadius: "8px" }}>
      <p style={{ fontSize: "14px", marginBottom: "8px" }}>No data yet</p>
      <p style={{ fontSize: "12px" }}>Data will appear here after market close at 3:31pm IST each trading day</p>
    </div>
  )}
</div>

      {/* ── News Section ── */}
      <div className="news-section" style={{ marginTop: "20px" }}>
        <h2>Market Moving News</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {news.slice(0, 10).map((item, index) => (
            <div className="news-card" key={index}>
              <div className="news-top">
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", lineHeight: "1.4" }}>
                    <a href={item.link} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{item.headline}</a>
                  </h3>
                  <div className="news-meta">
                    <span className={directionColor(item.label)}>{item.label}</span>
                    <span>{item.ticker}</span>
                    <span>{item.source}</span>
                    <span>{new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <div className="impact-score">
                  <span>Sentiment</span>
                  <strong className={directionColor(item.label)}>
                    {item.sentiment_value > 0 ? "+" : ""}{item.sentiment_value}
                  </strong>
                </div>
              </div>
              <div className="impact-bar">
                <div
                  className={`impact-fill ${item.sentiment_value >= 0 ? "green-bar" : "red-bar"}`}
                  style={{ width: `${Math.abs(item.sentiment_value) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default App;