import React, { useState, useEffect } from "react";
import {
  User,
  Award,
  Clock,
  Recycle,
  Camera,
  Smartphone,
  DollarSign,
  FileText,
  Tag,
  Save,
  X,
  ShoppingCart,
  Search,
  PlusCircle,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, storage } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/Profile.css";

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("sell");
  const [isLoading, setIsLoading] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [conditionFilter, setConditionFilter] = useState("All");
  const [showListingForm, setShowListingForm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  const [device, setDevice] = useState({
    name: "",
    brand: "",
    condition: "Used",
    price: "",
    description: "",
    image: "",
    createdAt: new Date(),
    userId: "",
    username: "",
  });

  // Check authentication status when component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setDevice((prev) => ({
          ...prev,
          userId: user.uid,
          username: user.displayName || user.email.split("@")[0],
        }));
        fetchMyListings(user.uid);
        fetchAvailableDevices(user.uid);
      } else {
        setCurrentUser(null);
        // Redirect to login or show login prompt if needed
      }
    });

    return () => unsubscribe();
  }, []);

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch user's listings
  const fetchMyListings = async (userId) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const q = query(collection(db, "marketplace"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMyListings(listings);
    } catch (error) {
      setNotification(
        <div className="error-notification">
          <div className="error-icon">!</div>
          Failed to load your listings: {error.message}
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available devices (excluding user's own)
  const fetchAvailableDevices = async (userId) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const q = query(collection(db, "marketplace"), where("userId", "!=", userId));
      const querySnapshot = await getDocs(q);
      const devices = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAvailableDevices(devices);
    } catch (error) {
      setNotification(
        <div className="error-notification">
          <div className="error-icon">!</div>
          Failed to load available devices: {error.message}
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price" && value < 0) return;
    setDevice((prev) => ({
      ...prev,
      [name]: name === "price" ? (value === "" ? "" : parseFloat(value)) : value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setNotification(
          <div className="error-notification">
            <div className="error-icon">!</div>
            Please select a valid image file (e.g., JPG, PNG). Detected type: {file.type || "unknown"}
          </div>
        );
        setSelectedFile(null);
        setPreviewImage("");
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setNotification(
          <div className="error-notification">
            <div className="error-icon">!</div>
            File size must be less than 5MB. Current size: {(file.size / 1024 / 1024).toFixed(2)}MB
          </div>
        );
        setSelectedFile(null);
        setPreviewImage("");
        return;
      }

      // Set selected file and create preview
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setImageError(false);
      };
      reader.onerror = (err) => {
        setImageError(true);
        setNotification(
          <div className="error-notification">
            <div className="error-icon">!</div>
            Error reading file. Please try again.
          </div>
        );
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
    setNotification(
      <div className="error-notification">
        <div className="error-icon">!</div>
        Failed to load image. Please check the file or URL.
      </div>
    );
  };

  // Submit form to create a new listing
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Authentication check
    if (!currentUser) {
      setNotification(
        <div className="error-notification">
          <div className="error-icon">!</div>
          You must be logged in to publish a listing.
        </div>
      );
      return;
    }

    // Validate required fields
    if (!device.name || !device.brand || !device.price || !selectedFile) {
      setNotification(
        <div className="error-notification">
          <div className="error-icon">!</div>
          Please fill in all required fields and select an image
        </div>
      );
      return;
    }

    // Validate description length
    if (device.description.length > 500) {
      setNotification(
        <div className="error-notification">
          <div className="error-icon">!</div>
          Description must be 500 characters or less
        </div>
      );
      return;
    }

    setIsLoading(true);

    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `images/${currentUser.uid}/${Date.now()}_${selectedFile.name}`);
      const snapshot = await uploadBytes(storageRef, selectedFile);
      
      // Get download URL
      const imageUrl = await getDownloadURL(snapshot.ref);
      
      // Create device document in Firestore
      const newDevice = {
        ...device,
        image: imageUrl,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "marketplace"), newDevice);
      
      // Show success notification
      setNotification(
        <div className="success-notification">
          <div className="success-icon">✓</div>
          Device listed successfully!
        </div>
      );

      // Reset form state
      setDevice({
        name: "",
        brand: "",
        condition: "Used",
        price: "",
        description: "",
        image: "",
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email.split("@")[0],
        createdAt: new Date(),
      });
      setSelectedFile(null);
      setPreviewImage("");
      fetchMyListings(currentUser.uid);
      setPreviewMode(false);
      setShowListingForm(false);
      setImageError(false);
    } catch (error) {
      setNotification(
        <div className="error-notification">
          <div className="error-icon">!</div>
          Error listing device: {error.message || "Unknown error"}
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    if (!device.name || !device.brand || !device.price || !selectedFile) {
      setNotification(
        <div className="error-notification">
          <div className="error-icon">!</div>
          Please fill in all required fields and select an image
        </div>
      );
      return;
    }
    setPreviewMode(!previewMode);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle price filter changes
  const handlePriceFilterChange = (e) => {
    const { name, value } = e.target;
    setPriceFilter({
      ...priceFilter,
      [name]: value === "" ? "" : parseFloat(value),
    });
  };

  // Handle condition filter changes
  const handleConditionFilterChange = (e) => {
    setConditionFilter(e.target.value);
  };

  // Contact seller function
  const contactSeller = (device) => {
    setNotification(
      <div className="success-notification">
        <div className="success-icon">✓</div>
        Contact request sent to {device.username}!
      </div>
    );
  };

  // Filter devices based on search and filters
  const filteredDevices = availableDevices.filter((device) => {
    const matchesSearch =
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrice =
      (priceFilter.min === "" || device.price >= priceFilter.min) &&
      (priceFilter.max === "" || device.price <= priceFilter.max);

    const matchesCondition =
      conditionFilter === "All" || device.condition === conditionFilter;

    return matchesSearch && matchesPrice && matchesCondition;
  });

  // Condition icons
  const conditionIcons = {
    New: <Award className="condition-icon new" />,
    Used: <Clock className="condition-icon used" />,
    Damaged: <Recycle className="condition-icon damaged" />,
  };

  // Get CSS class for condition
  const getConditionClass = (condition) => {
    return condition ? condition.toLowerCase().replace(/\s+/g, "-") : "used";
  };

  // Format dates for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } catch {
      return "Just now";
    }
  };

  // Render device image with fallback
  const renderDeviceImage = (imgSrc, altText, isPreview = false) => {
    const imageToRender = isPreview ? previewImage : imgSrc;
    if (!imageToRender) {
      return (
        <div className="image-fallback">
          <ImageIcon size={24} />
          <p>Image not available</p>
        </div>
      );
    }
    return (
      <img
        src={imageToRender}
        alt={altText || "Device image"}
        onError={handleImageError}
        loading="lazy"
        className="device-image-img"
      />
    );
  };

  return (
    <div className="profile-container">
      {notification && (
        <div className="notification-wrapper">{notification}</div>
      )}

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === "sell" ? "active" : ""}`}
          onClick={() => setActiveTab("sell")}
        >
          <Tag size={18} />
          <span>Sell</span>
        </button>
        <button
          className={`tab-button ${activeTab === "buy" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("buy");
            fetchAvailableDevices(currentUser?.uid);
          }}
        >
          <ShoppingCart size={18} />
          <span>Buy</span>
        </button>
      </div>

      {activeTab === "sell" && (
        <div className="sell-section">
          <div className="section-header">
            <h2>
              <Tag size={20} /> Selling Dashboard
            </h2>
            <p>Manage your listings and create new ones</p>
          </div>

          <div className="my-listings-section">
            <div className="section-header-with-action">
              <h3>
                <Smartphone size={18} /> My Current Listings
              </h3>
              <button
                className="action-button"
                onClick={() => setShowListingForm(!showListingForm)}
              >
                <PlusCircle size={16} />
                {showListingForm ? "Hide Form" : "Add New Listing"}
              </button>
            </div>

            {isLoading && !previewMode ? (
              <div className="loading-spinner">Loading your listings...</div>
            ) : myListings.length > 0 ? (
              <div className="listings-grid">
                {myListings.map((listing, index) => (
                  <div
                    className={`device-card ${getConditionClass(listing.condition)}`}
                    key={listing.id || `listing-${index}`}
                  >
                    <div className="device-image">
                      {renderDeviceImage(listing.image, listing.name, false)}
                    </div>
                    <div className="device-content">
                      <div className="device-header">
                        <h3>{listing.name || "Unnamed Device"}</h3>
                        <div className="device-price">
                          ${parseFloat(listing.price || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="device-brand">
                        {listing.brand || "Unknown Brand"}
                      </div>
                      <div className="device-condition">
                        {conditionIcons[listing.condition]}
                        {listing.condition}
                      </div>
                      <div className="device-description">
                        {listing.description || "No description provided."}
                      </div>
                      <div className="device-footer">
                        <div className="listing-date">
                          Listed {formatDate(listing.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Smartphone size={48} />
                <h3>No Listings Yet</h3>
                <p>You haven't listed any devices for sale.</p>
                <button
                  className="action-button"
                  onClick={() => setShowListingForm(true)}
                >
                  <PlusCircle size={16} />
                  Create Your First Listing
                </button>
              </div>
            )}
          </div>

          {showListingForm && !previewMode && (
            <div className="sell-container">
              <div className="section-header">
                <h3>
                  <PlusCircle size={18} /> New Device Listing
                </h3>
                <p>
                  Complete the form below to list your device on the marketplace
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="lbl" htmlFor="name">
                    <Smartphone size={16} /> Device Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="e.g. iPhone 12 Pro"
                    value={device.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="brand">
                    <Award size={16} /> Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    placeholder="e.g. Apple, Samsung, etc."
                    value={device.brand}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="condition">
                      <Clock size={16} /> Condition
                    </label>
                    <select
                      id="condition"
                      name="condition"
                      value={device.condition}
                      onChange={handleChange}
                      className={`condition-select ${getConditionClass(
                        device.condition
                      )}`}
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="price">
                      <DollarSign size={16} /> Price
                    </label>
                    <div className="price-input">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        placeholder="0.00"
                        value={device.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">
                    <FileText size={16} /> Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Describe your device's features, condition, included accessories, etc."
                    value={device.description}
                    onChange={handleChange}
                    maxLength={500}
                    required
                  ></textarea>
                  <div className="char-count">
                    {device.description.length}/500
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="image">
                    <Camera size={16} /> Upload Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  {imageError && (
                    <div className="input-error">
                      <AlertCircle size={14} /> Error uploading image
                    </div>
                  )}
                  {previewImage && (
                    <div className="image-preview-container">
                      <div className="image-preview">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="device-image-img"
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewImage("");
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="preview-button"
                    onClick={togglePreview}
                  >
                    Preview Listing
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Submitting..." : "List Device"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {previewMode && (
            <div className="preview-container">
              <div className="preview-header">
                <h3>Preview Listing</h3>
                <button className="close-preview" onClick={togglePreview}>
                  <X size={18} />
                </button>
              </div>

              <div className={`device-card preview ${getConditionClass(device.condition)}`}>
                <div className="device-image">
                  {renderDeviceImage(device.image, device.name, true)}
                </div>
                <div className="device-content">
                  <div className="device-header">
                    <h3>{device.name || "Device Name"}</h3>
                    <div className="device-price">
                      ${parseFloat(device.price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="device-brand">{device.brand || "Brand"}</div>
                  <div className="device-condition">
                    {conditionIcons[device.condition]}
                    {device.condition}
                  </div>
                  <div className="device-description">
                    {device.description || "No description provided."}
                  </div>
                  <div className="device-footer">
                    <div className="seller-info">
                      <User size={16} />
                      <span>
                        {currentUser?.displayName ||
                          currentUser?.email?.split("@")[0] ||
                          "You"}
                      </span>
                    </div>
                    <div className="listing-date">Will be listed soon</div>
                  </div>
                </div>
              </div>

              <div className="preview-actions">
                <button className="edit-button" onClick={togglePreview}>
                  Edit Listing
                </button>
                <button
                  className="publish-button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Publishing..." : "Publish Listing"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "buy" && (
        <div className="buy-section">
          <div className="section-header">
            <h2>
              <ShoppingCart size={20} /> Buy Devices
            </h2>
            <p>Browse all available devices for sale</p>
          </div>

          <div className="filter-section">
            <div className="search-container">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search devices by name, brand, or description..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            <div className="filter-controls">
              <div className="price-filter">
                <span>Price Range:</span>
                <div className="price-inputs">
                  <div className="price-input-container">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      name="min"
                      value={priceFilter.min}
                      onChange={handlePriceFilterChange}
                      min="0"
                    />
                  </div>
                  <span>-</span>
                  <div className="price-input-container">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      name="max"
                      value={priceFilter.max}
                      onChange={handlePriceFilterChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="condition-filter">
                <span>Condition:</span>
                <select
                  value={conditionFilter}
                  onChange={handleConditionFilterChange}
                  className="condition-select"
                >
                  <option value="All">All Conditions</option>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-spinner">Loading available devices...</div>
          ) : filteredDevices.length > 0 ? (
            <div className="listings-grid">
              {filteredDevices.map((device, index) => (
                <div
                  className={`device-card ${getConditionClass(device.condition)}`}
                  key={device.id || `device-${index}`}
                >
                  <div className="device-image">
                    {renderDeviceImage(device.image, device.name, false)}
                  </div>
                  <div className="device-content">
                    <div className="device-header">
                      <h3>{device.name || "Unnamed Device"}</h3>
                      <div className="device-price">
                        ${parseFloat(device.price || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="device-brand">
                      {device.brand || "Unknown Brand"}
                    </div>
                    <div className="device-condition">
                      {conditionIcons[device.condition]}
                      {device.condition}
                    </div>
                    <div className="device-description">
                      {device.description || "No description provided."}
                    </div>
                    <div className="device-footer">
                      <div className="seller-info">
                        <User size={16} />
                        <span>{device.username || "Anonymous"}</span>
                      </div>
                      <div className="listing-date">
                        Listed {formatDate(device.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="buy-actions">
                    <button
                      className="contact-button"
                      onClick={() => contactSeller(device)}
                    >
                      Contact Seller
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingCart size={48} />
              <h3>No Devices Available</h3>
              <p>There are no devices available matching your search criteria.</p>
              <button
                className="clear-filters-button"
                onClick={() => {
                  setSearchTerm("");
                  setPriceFilter({ min: "", max: "" });
                  setConditionFilter("All");
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default Profile;