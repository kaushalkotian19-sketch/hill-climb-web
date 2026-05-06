// database.js - Persistent Local Saving & Economy

// --- COIN BANK ---
function getTotalCoins() {
    return parseInt(localStorage.getItem('hillClimbBank')) || 0;
}

function saveCoins(newCoins) {
    let currentBank = getTotalCoins();
    currentBank += newCoins;
    localStorage.setItem('hillClimbBank', currentBank);
    return currentBank;
}

function spendCoins(amount) {
    let currentBank = getTotalCoins();
    if (currentBank >= amount) {
        currentBank -= amount;
        localStorage.setItem('hillClimbBank', currentBank);
        return true; 
    }
    return false; 
}

// --- VEHICLE UNLOCKS ---
function isVehicleUnlocked(vehicleType) {
    if (vehicleType === 'jeep') return true; // Starter car
    return localStorage.getItem('unlocked_' + vehicleType) === 'true';
}

function unlockVehicle(vehicleType) {
    localStorage.setItem('unlocked_' + vehicleType, 'true');
}
