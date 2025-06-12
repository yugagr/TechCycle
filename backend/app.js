const express = require('express');
const cors = require('cors');
const predictRoute = require('./routes/predict');

const app = express();
app.use(cors());
app.use('/api', predictRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
