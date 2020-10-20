const stringToBytes = (options) => {
    if (Array.isArray(options)) {
        return options.map(option => web3.utils.asciiToHex(option));
    }
    return web3.utils.asciiToHex(options);
}

const bytesToString = (options) => {
    if (Array.isArray(options)) {
        return options.map(option => web3.utils.hexToUtf8(option));
    }
    return web3.utils.hexToUtf8(options);
}

exports.stringToBytes = stringToBytes;
exports.bytesToString = bytesToString;
