require('dotenv').config();
module.exports = (robot) => {
  require('./scripts/fitnessBot')(robot);
};
