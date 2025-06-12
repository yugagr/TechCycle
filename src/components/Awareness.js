import React, { useState } from "react";
import {
  AlertTriangle,
  Info,
  TreeDeciduous,
  Upload,
  X,
  Camera,
  ImageIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import "../styles/Awareness.css";
import img5 from "../images/image.png";

const facts = [
  {
    title: "Growing E-Waste Crisis",
    description:
      "E-waste is rapidly increasing due to rising electronics consumption and short product lifecycles. Toxic materials like lead and mercury pollute soil and water, harming ecosystems and human health. Poor recycling practices worsen the crisis, especially in developing nations. Sustainable disposal, stricter regulations, and consumer awareness are essential to mitigate this threat.",
    icon: AlertTriangle,
  },
  {
    title: "Environmental Impact",
    description:
      "E-waste recycling reduces landfill waste, conserves natural resources, and prevents toxic chemicals like lead and mercury from polluting air, soil, and water. However, improper recycling methods release hazardous substances, harming workers and ecosystems. Sustainable recycling practices, stricter regulations, and advanced technology are crucial for minimizing environmental damage and promoting sustainability.",
    icon: TreeDeciduous,
  },
  {
    title: "Valuable Materials",
    description:
      "Electronic waste holds valuable materials like gold, silver, and rare metals. One metric ton of circuit boards contains 40–800 times more gold than mined ore, making e-waste recycling highly profitable. Efficient recovery reduces environmental damage from mining, conserves resources, and supports a circular economy by reusing precious materials sustainably.",
    icon: Info,
  },
];

const categories = [
  {
    name: "Electronics",
    examples: ["Laptops", "Smartphones", "Tablets"],
    icon: ImageIcon,
  },
  {
    name: "Components",
    examples: ["Circuit Boards", "CPUs", "Memory"],
    icon: Camera,
  },
];

function Awareness() {
  // State variables for the E-Waste Identifier section
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setError(null);
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setPrediction(null);
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/identify-ewaste`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      setPrediction(data.prediction);
    } catch (error) {
      setError("Error analyzing image. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="awareness-container">
      {/* E-Waste Awareness Facts Section */}
      <div className="awareness-card">
        <h2 className="sections-title">E-Waste Awareness</h2>
        <div className="facts-grid">
          {facts.map((fact, index) => (
            <div key={index} className="fact-card">
              <div className="fact-header">
                <fact.icon className="fact-icon" />
                <h3 className="fact-title">{fact.title}</h3>
              </div>
              <p className="fact-description">{fact.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* E-Waste Identifier Section (Improved) */}
      <div className="awareness-card">
        <div className="identifier-section">
          <div className="identifier-header">
            <h2 className="identifier-title">E-Waste Identifier</h2>
            <p className="identifier-subtitle">
              Upload a photo of your electronic waste for identification and
              recycling guidance
            </p>
          </div>

          <div className="upload-area">
            <div className="upload-area-content">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              {!selectedImage ? (
                <label htmlFor="image-upload" className="upload-label">
                  <div className="upload-icon-wrapper">
                    <Upload className="upload-icon" />
                  </div>
                  <div className="upload-text">
                    <span className="upload-click">Click to upload</span> or
                    drag and drop
                  </div>
                  <p className="upload-hint">PNG, JPG up to 10MB</p>
                </label>
              ) : (
                <div className="uploaded-image-wrapper">
                  <button
                    onClick={clearImage}
                    className="remove-image-btn"
                    aria-label="Remove image"
                  >
                    <X className="remove-image-icon" />
                  </button>
                  <img
                    src={selectedImage}
                    alt="Selected e-waste"
                    className="uploaded-image"
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="identifier-error">
              <AlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {isAnalyzing && (
            <div className="identifier-analyzing">
              <div className="analyzing-loader">
                <div className="loader-dot"></div>
                <div className="loader-dot delay-100"></div>
                <div className="loader-dot delay-200"></div>
                <span className="analyzing-text">Analyzing image...</span>
              </div>
            </div>
          )}

          {prediction && (
            <div className="identifier-result">
              <div className="result-header">
                <CheckCircle className="result-icon" />
                <h3 className="result-title">Analysis Result</h3>
              </div>
              <p className="result-prediction">{prediction}</p>
              <div className="recycling-instructions">
                <h4 className="instructions-title">Recycling Instructions:</h4>
                <ul className="instructions-list">
                  <li className="instructions-item">
                    <div className="instructions-bullet"></div>
                    <span>Please remove any batteries before recycling</span>
                  </li>
                  <li className="instructions-item">
                    <div className="instructions-bullet"></div>
                    <span>Ensure all personal data is wiped</span>
                  </li>
                  <li className="instructions-item">
                    <div className="instructions-bullet"></div>
                    <span>Take to your nearest e-waste recycling center</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Impact of E-Waste Recycling Section */}
      <div className="awareness-card">
        <h2 className="section-title">Impact of E-Waste Recycling</h2>
        <div className="impact-grid">
          <div className="image-container">
            <img src={img5} alt="E-waste recycling" className="impact-image" />
          </div>
          <div className="impact-content">
            <h3 className="impact-title">Why Recycle E-Waste?</h3>
            <ul className="impact-list">
              <li className="impact-item">
                <div className="bullet"></div>
                <span className="impact-text">
                  Prevents toxic materials from entering landfills
                </span>
              </li>
              <li className="impact-item">
                <div className="bullet"></div>
                <span className="impact-text">
                  Recovers valuable materials for reuse
                </span>
              </li>
              <li className="impact-item">
                <div className="bullet"></div>
                <span className="impact-text">
                  Reduces energy consumption in manufacturing
                </span>
              </li>
              <li className="impact-item">
                <div className="bullet"></div>
                <span className="impact-text">
                  Creates green jobs in recycling industry
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Awareness;
