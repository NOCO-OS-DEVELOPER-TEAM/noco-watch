const os = require('os');

function getLocalIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        addresses.push({ name, address: entry.address });
      }
    }
  }

  return addresses;
}

function isPrivateLan(address) {
  return (
    address.startsWith('192.168.') ||
    address.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

function getPreferredLanAddress() {
  const addresses = getLocalIPv4Addresses();
  if (addresses.length === 0) return null;

  const wifi = addresses.find(
    (a) =>
      isPrivateLan(a.address) &&
      /wi-?fi|wlan|wireless/i.test(a.name || '')
  );
  if (wifi) return wifi.address;

  const privateLan = addresses.find((a) => isPrivateLan(a.address));
  return (privateLan || addresses[0]).address;
}

module.exports = { getLocalIPv4Addresses, getPreferredLanAddress };
