/**
 * Determines if a license is on the user object since it is an array of objects
 * @param userLicenses is the array of licenses on the user object
 * @param license_id is the license we are checking to see if already on the object
 */
const findLicense = function(userLicenses, license_id) {
  let arrLength = userLicenses.length
  for (var i=0; i<arrLength; i++) {
    if(userLicenses[i].license_id.equals(license_id)) {
      return i
    }
  }
  return -1;
}

module.exports = {
  findLicense: findLicense
}