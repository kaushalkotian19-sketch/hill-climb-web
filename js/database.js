// database.js - Persistent Local Saving

function getTotalCoins() {
    return parseInt(localStorage.getItem('hillClimbBank')) || 0;
}

function saveCoins(newCoins) {
    let currentBank = getTotalCoins();
    currentBank += newCoins;
    localStorage.setItem('hillClimbBank', currentBank);
    return currentBank;
}
