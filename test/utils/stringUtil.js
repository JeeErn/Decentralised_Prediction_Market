const stringToBytes = (options) => {
    return options.map(option => web3.utils.asciiToHex(option));
}

const bytesToString = (options) => {
    return options.map(option => web3.utils.hexToUtf8(option));
}

exports.stringToBytes = stringToBytes;
exports.bytesToString = bytesToString;
